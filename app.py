from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn

from interview_bot import AudioLoop

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, mode: str = "none"):
    await websocket.accept()
    main = AudioLoop(video_mode=mode, websocket=websocket)
    await main.run()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
