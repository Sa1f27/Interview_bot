document.addEventListener('DOMContentLoaded', () => {
    const cameraBtn = document.getElementById('camera-btn');
    const screenBtn = document.getElementById('screen-btn');
    const voiceBtn = document.getElementById('voice-btn');
    const userVideo = document.getElementById('user-video');
    const aiVideo = document.getElementById('ai-video');
    const aiAudio = document.getElementById('ai-audio');
    const logContent = document.getElementById('log-content');

    let ws;
    let mediaRecorder;
    let audioChunks = [];

    const startStream = async (mode) => {
        if (ws) {
            ws.close();
        }

        logContent.textContent = ''; // Clear previous logs

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            logContent.textContent += 'WebSocket connection established.\n';
            ws.send(mode);
        };

        ws.onmessage = (event) => {
            if (typeof event.data === 'string') {
                const msg = JSON.parse(event.data);
                if (msg.type === 'text') {
                    logContent.textContent += `Gemini: ${msg.data}\n`;
                } else if (msg.type === 'video') {
                    aiVideo.src = `data:image/jpeg;base64,${msg.data}`;
                }
            } else {
                // It's audio data
                audioChunks.push(event.data);
                playAudio();
            }
        };

        ws.onclose = () => {
            logContent.textContent += 'WebSocket connection closed.\n';
            if (mediaRecorder) {
                mediaRecorder.stop();
            }
        };

        ws.onerror = (error) => {
            logContent.textContent += `WebSocket error: ${error.message}\n`;
        };

        // Get microphone access
        try {
            let stream;
            if (mode === 'screen') {
                stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            } else {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: (mode === 'camera') });
            }

            if (stream) {
                if (mode === 'camera' || mode === 'screen') {
                    userVideo.srcObject = stream;
                }
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        ws.send(event.data);
                    }
                };
                mediaRecorder.start(250); // Send data every 250ms
            }
        } catch (error) {
            logContent.textContent += `Error getting user media: ${error.message}\n`;
        }
    };

    const playAudio = async () => {
        if (audioChunks.length > 0 && !aiAudio.src) {
            const audioBlob = new Blob(audioChunks);
            aiAudio.src = URL.createObjectURL(audioBlob);
            audioChunks = [];
            try {
                await aiAudio.play();
            } catch (err) {
                console.error('Error playing audio:', err);
            }
            aiAudio.onended = () => {
                aiAudio.src = null;
                playAudio();
            }
        }
    }

    cameraBtn.addEventListener('click', () => startStream('camera'));
    screenBtn.addEventListener('click', () => startStream('screen'));
    voiceBtn.addEventListener('click', () => startStream('voice'));
});