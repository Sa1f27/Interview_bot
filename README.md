# Gemini Interview Bot

This project is a web-based interface for a Gemini-powered speech-to-speech interview bot. It allows you to interact with the Gemini model in three different modes: voice, camera, and screen.

## Features

*   **Web-based Interface:** A user-friendly interface to interact with the Gemini model.
*   **Three Modes:**
    *   **Voice:** Speak to the model and hear its response.
    *   **Camera:** Stream your camera feed to the model.
    *   **Screen:** Share your screen with the model.
*   **Real-time Streaming:** Real-time audio and video streaming between the browser and the backend.
*   **FastAPI Backend:** A robust and asynchronous backend powered by FastAPI.

## Getting Started

### Prerequisites

*   Python 3.9+
*   A Google Gemini API key.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3.  **Install the dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up your API key:**
    Create a `.env` file in the root of the project and add your Gemini API key:
    ```
    GEMINI_API_KEY="your-api-key"
    ```

### Running the Application

1.  **Start the FastAPI server:**
    ```bash
    uvicorn main:app --reload
    ```

2.  **Open your browser:**
    Navigate to `http://127.0.0.1:8000`.

## Usage

1.  Once the application is running, you will see three buttons: "Camera", "Screen", and "Voice".
2.  Click on the desired mode to start the interview.
3.  The browser will ask for microphone and/or camera permissions. Please grant them.
4.  You can now start interacting with the Gemini model.

## Project Structure

*   `main.py`: The main FastAPI application file. It contains the backend logic for handling WebSockets and interacting with the Gemini API.
*   `templates/index.html`: The main HTML file for the frontend.
*   `static/script.js`: The JavaScript file for the frontend. It handles user interactions, microphone access, and WebSocket communication.
*   `static/styles.css`: The CSS file for styling the frontend.
*   `requirements.txt`: A list of the Python dependencies for the project.
*   `.env.example`: An example file for the environment variables.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
