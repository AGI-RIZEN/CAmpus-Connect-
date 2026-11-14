import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from './api/config';
import { getAccessToken } from './api/token-storage';

// The Socket.io server is attached to the bare HTTP server, not mounted under /api like the
// REST routes, so the connection origin needs that suffix stripped.
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');

let socket: Socket | null = null;

/** Lazily creates (and reuses) a single authenticated socket connection for the whole app.
 *  `auth` is a function so a reconnect always sends the *current* access token, not whatever
 *  was valid when the socket was first created. */
export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: false,
    auth: async (cb) => {
      const token = await getAccessToken();
      cb({ token });
    },
  });

  return socket;
}
