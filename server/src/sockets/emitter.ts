import type { Server } from 'socket.io';

// Set once by server.ts right after the Socket.io server is created. Routes/services run in
// the same process but are wired up (via app.ts) before `io` exists, so this indirection lets
// chat.service.ts emit real-time events without a circular import at module-load time.
let ioInstance: Server | null = null;

export function setIO(io: Server): void {
  ioInstance = io;
}

export function emitToGroup(groupChatId: string, event: string, payload: unknown): void {
  ioInstance?.to(`group:${groupChatId}`).emit(event, payload);
}
