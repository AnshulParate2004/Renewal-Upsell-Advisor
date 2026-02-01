from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting: {e}")
                # clean up dead connections could happen here

    async def broadcast_alert(self, message: str, severity: str = "info"):
        alert_payload = {
            "type": "alert",
            "message": message,
            "severity": severity,
            "timestamp": "Now" # In real app, use datetime
        }
        await self.broadcast(alert_payload)

manager = ConnectionManager()

@router.websocket("/ws/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, listen for client messages if necessary
            data = await websocket.receive_text()
            # Echo back for handshake confirmation or ping/pong
            await websocket.send_json({"status": "received", "data": data})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
