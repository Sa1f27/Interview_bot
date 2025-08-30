const cameraBtn = document.getElementById('camera-btn');
const screenBtn = document.getElementById('screen-btn');
const noneBtn = document.getElementById('none-btn');
const stopBtn = document.getElementById('stop-btn');
const sendBtn = document.getElementById('send-btn');
const messageInput = document.getElementById('message-input');
const conversation = document.getElementById('conversation');
const video = document.getElementById('video');

function scrollToBottom() {
    conversation.scrollTop = conversation.scrollHeight;
}

let websocket;
let mediaStream;

function startInterview(mode) {
    cameraBtn.disabled = true;
    screenBtn.disabled = true;
    noneBtn.disabled = true;
    stopBtn.disabled = false;

    websocket = new WebSocket(`ws://${location.host}/ws?mode=${mode}`);

    websocket.onopen = () => {
        console.log('WebSocket connection established');
    };

    websocket.onmessage = (event) => {
        if (typeof event.data === 'string') {
            const message = document.createElement('div');
            message.classList.add('message', 'ai-message');
            message.textContent = event.data;
            conversation.appendChild(message);
            scrollToBottom();
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
        cameraBtn.disabled = false;
        screenBtn.disabled = false;
        noneBtn.disabled = false;
        stopBtn.disabled = true;
    };

    if (mode === 'camera' || mode === 'screen') {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                mediaStream = stream;
                video.srcObject = stream;
            })
            .catch((error) => {
                console.error('Error accessing media devices:', error);
            });
    }
}

cameraBtn.addEventListener('click', () => startInterview('camera'));
screenBtn.addEventListener('click', () => startInterview('screen'));
noneBtn.addEventListener('click', () => startInterview('none'));

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
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'user-message');
        messageDiv.textContent = message;
        conversation.appendChild(messageDiv);
        websocket.send(message);
        messageInput.value = '';
        scrollToBottom();
    }
});