const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const sendBtn = document.getElementById('send-btn');
const messageInput = document.getElementById('message-input');
const conversation = document.getElementById('conversation');
const video = document.getElementById('video');

let websocket;
let mediaStream;

startBtn.addEventListener('click', () => {
    startBtn.disabled = true;
    stopBtn.disabled = false;

    websocket = new WebSocket(`ws://${location.host}/ws`);

    websocket.onopen = () => {
        console.log('WebSocket connection established');
    };

    websocket.onmessage = (event) => {
        if (typeof event.data === 'string') {
            const message = document.createElement('div');
            message.textContent = event.data;
            conversation.appendChild(message);
        } else {
            const audioContext = new AudioContext();
            const source = audioContext.createBufferSource();
            audioContext.decodeAudioData(event.data, (buffer) => {
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.start(0);
            });
        }
    };

    websocket.onclose = () => {
        console.log('WebSocket connection closed');
        startBtn.disabled = false;
        stopBtn.disabled = true;
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            mediaStream = stream;
            video.srcObject = stream;
        })
        .catch((error) => {
            console.error('Error accessing media devices:', error);
        });
});

stopBtn.addEventListener('click', () => {
    if (websocket) {
        websocket.close();
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
});

sendBtn.addEventListener('click', () => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        const message = messageInput.value;
        websocket.send(message);
        messageInput.value = '';
    }
});