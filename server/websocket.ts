import { WebSocket } from 'ws';
import { log } from './vite';

// Map to store active WebSocket connections, mapping userId to the WebSocket instance.
export const wsConnections = new Map<number, WebSocket>();

export function handleWebSocketConnection(ws: WebSocket) {
  let userId: number | null = null;

  log('Client connected to WebSocket');

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message);
      
      // Handle registration message from client
      if (data.type === 'register' && data.userId) {
        userId = data.userId;
        wsConnections.set(userId, ws);
        // Attach userId to the ws object for easy lookup on close
        (ws as any).userId = userId;

        log(`WebSocket client registered for userId: ${userId}`);
        ws.send(JSON.stringify({ type: 'registered', message: 'Successfully registered for real-time updates.' }));
      } else {
        log(`Received WebSocket message from user ${userId}: ${message}`);
      }
    } catch (error) {
      log('Failed to parse WebSocket message or invalid format: ' + message, 'error');
    }
  });

  ws.on('close', () => {
    const closedUserId = (ws as any).userId;
    if (closedUserId && wsConnections.has(closedUserId)) {
      wsConnections.delete(closedUserId);
      log(`Client for userId: ${closedUserId} disconnected and removed.`);
    } else {
      log('An unregistered client disconnected.');
    }
  });

  ws.on('error', (error) => {
    log(`WebSocket error: ${error.message}`, 'error');
  });

  ws.send(JSON.stringify({ type: 'welcome', message: 'Welcome! Please register with your userId.' }));
}
