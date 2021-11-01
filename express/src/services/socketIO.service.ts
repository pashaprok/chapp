import { appSocketIO } from '../app';
import { CHATMSGEVENT, DISCONNECT } from '../constants/socketio';

export function socketIOService(socket) {
  socket.broadcast.emit(CHATMSGEVENT, 'New user connected!');
  socket.on(CHATMSGEVENT, (msg) => {
    appSocketIO.emit('chat message', msg);
  });

  socket.on(DISCONNECT, () => {
    socket.broadcast.emit(CHATMSGEVENT, 'User disconnected!');
  });
}
