
import os
import asyncio
import base64
import io
import traceback
import logging

import cv2
import pyaudio
import PIL.Image
import mss

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from google import genai
from google.genai import types

# --- Logger Setup ---
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
# Create a file handler
file_handler = logging.FileHandler('interview-bot.log')
file_handler.setLevel(logging.DEBUG)
# Create a console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
# Create a formatter and set it for both handlers
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)
# Add the handlers to the logger
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# --- FastAPI Setup ---
app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Gemini and Audio Config ---
FORMAT = pyaudio.paInt16
CHANNELS = 1
SEND_SAMPLE_RATE = 16000
RECEIVE_SAMPLE_RATE = 24000
CHUNK_SIZE = 1024

MODEL = "models/gemini-2.5-flash-preview-native-audio-dialog"

client = genai.Client(
    http_options={"api_version": "v1beta"},
    api_key=os.environ.get("GEMINI_API_KEY"),
)

CONFIG = types.LiveConnectConfig(
    response_modalities=[
        "AUDIO",
    ],
    media_resolution="MEDIA_RESOLUTION_MEDIUM",
    speech_config=types.SpeechConfig(
        voice_config=types.VoiceConfig(
            prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Zephyr")
        )
    ),
    context_window_compression=types.ContextWindowCompressionConfig(
        trigger_tokens=25600,
        sliding_window=types.SlidingWindow(target_tokens=12800),
    ),
)

pya = pyaudio.PyAudio()

# --- Main Application Logic ---
import websockets

class InterviewBot:
    def __init__(self, mode: str, websocket: WebSocket):
        self.mode = mode
        self.websocket = websocket
        self.session = None
        self.out_queue = asyncio.Queue()

    async def run(self):
        logger.info(f"Starting interview bot in {self.mode} mode.")
        try:
            async with client.aio.live.connect(model=MODEL, config=CONFIG) as session:
                self.session = session
                async with asyncio.TaskGroup() as tg:
                    tg.create_task(self.receive_from_frontend())
                    tg.create_task(self.send_to_gemini())
                    tg.create_task(self.receive_from_gemini())
                    if self.mode == "camera":
                        tg.create_task(self.get_frames())
                    elif self.mode == "screen":
                        tg.create_task(self.get_screen())
        except websockets.exceptions.ConnectionClosedError as e:
            error_message = f"Connection to Gemini API failed: {e}. Check your API key and quota."
            logger.error(error_message)
            await self.websocket.send_json({"type": "text", "data": error_message})
            traceback.print_exc()
        except Exception as e:
            logger.error(f"Error during interview: {e}")
            await self.websocket.send_json({"type": "text", "data": f"An unexpected error occurred: {e}"})
            traceback.print_exc()

    async def receive_from_frontend(self):
        while True:
            data = await self.websocket.receive_bytes()
            await self.out_queue.put({"data": data, "mime_type": "audio/pcm"})

    async def send_to_gemini(self):
        while True:
            msg = await self.out_queue.get()
            await self.session.send(input=msg)

    async def receive_from_gemini(self):
        while True:
            turn = self.session.receive()
            async for response in turn:
                if data := response.data:
                    await self.websocket.send_bytes(data)
                if text := response.text:
                    logger.info(f"Gemini: {text}")
                    await self.websocket.send_json({"type": "text", "data": text})


    def _get_frame(self, cap):
        ret, frame = cap.read()
        if not ret:
            return None
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = PIL.Image.fromarray(frame_rgb)
        img.thumbnail([1024, 1024])

        image_io = io.BytesIO()
        img.save(image_io, format="jpeg")
        image_io.seek(0)

        mime_type = "image/jpeg"
        image_bytes = image_io.read()
        return {"mime_type": mime_type, "data": base64.b64encode(image_bytes).decode()}

    async def get_frames(self):
        cap = await asyncio.to_thread(cv2.VideoCapture, 0)
        while True:
            frame = await asyncio.to_thread(self._get_frame, cap)
            if frame is None:
                break
            await self.out_queue.put(frame)
            await self.websocket.send_json({"type": "video", "data": frame["data"]})
            await asyncio.sleep(1.0)
        cap.release()

    def _get_screen(self):
        sct = mss.mss()
        monitor = sct.monitors[0]
        i = sct.grab(monitor)
        mime_type = "image/jpeg"
        image_bytes = mss.tools.to_png(i.rgb, i.size)
        img = PIL.Image.open(io.BytesIO(image_bytes))
        image_io = io.BytesIO()
        img.save(image_io, format="jpeg")
        image_io.seek(0)
        image_bytes = image_io.read()
        return {"mime_type": mime_type, "data": base64.b64encode(image_bytes).decode()}

    async def get_screen(self):
        while True:
            frame = await asyncio.to_thread(self._get_screen)
            if frame is None:
                break
            await self.out_queue.put(frame)
            await self.websocket.send_json({"type": "video", "data": frame["data"]})
            await asyncio.sleep(1.0)

# --- FastAPI Endpoints ---
@app.get("/")
async def get():
    with open("templates/index.html") as f:
        return HTMLResponse(content=f.read(), status_code=200)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("Frontend connected.")
    try:
        # The first message from the frontend is the mode
        mode = await websocket.receive_text()
        bot = InterviewBot(mode, websocket)
        await bot.run()
    except WebSocketDisconnect:
        logger.info("Frontend disconnected.")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
