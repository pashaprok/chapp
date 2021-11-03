import { appSocketIO } from '../app';
import { CHAT_MSG_EVENT, DISCONNECT } from '../constants/socketio';

export function socketIOService(socket) {
  socket.broadcast.emit(CHAT_MSG_EVENT, 'New user connected!');
  socket.on(CHAT_MSG_EVENT, (msg) => {
    appSocketIO.emit('chat message', msg);
  });

  socket.on(DISCONNECT, () => {
    socket.broadcast.emit(CHAT_MSG_EVENT, 'User disconnected!');
  });
}
