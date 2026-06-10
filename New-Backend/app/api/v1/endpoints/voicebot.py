from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/voicebot", tags=["voicebot"])


@router.post("/chat")
async def voicebot_chat(payload: dict):
    return {"reply": "Hello from Revenue Navigator voicebot.", "context": payload}


@router.websocket("/ws")
async def voicebot_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({"type": "response", "text": f"Echo: {data}"})
    except WebSocketDisconnect:
        pass


@router.websocket("/audio/ws")
async def voicebot_audio_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_bytes()
            await websocket.send_bytes(data)
    except WebSocketDisconnect:
        pass
