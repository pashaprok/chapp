import { appSocketIO } from '../app';
import {
  CHAT_INFO,
  DISCONNECT,
  RECEIVE_CHAT_MSG,
  SEND_CHAT_MSG,
  USER_JOIN,
} from '../constants/socketio';
import { User } from '../models/user.model';
import { Socket } from 'socket.io';

export function socketIOService(socket: Socket) {
  const users: Map<string, User> = new Map<string, User>();

  socket.on(USER_JOIN, (user: User | undefined) => {
    if (user) {
      users.set(socket.id, user);
      const msg = `${user.name} is connected!`;
      const msgme = 'You are connected!';
      const names = Array.from(users.values())
        .map((user) => user.name)
        .join(', ');
      const msg2 = `Now in chat ${users.size} people. \n This people: ${names}`;

      socket.emit(CHAT_INFO, msgme);
      socket.broadcast.emit(CHAT_INFO, msg);
      socket.broadcast.emit(CHAT_INFO, msg2);

      socket.on(SEND_CHAT_MSG, (msg: string, sender: User) => {
        const text = `${user.name}: ${msg}`;
        appSocketIO.emit(RECEIVE_CHAT_MSG, text, sender);
      });
    }
  });

  socket.on(CHAT_INFO, (msg) => {
    appSocketIO.emit(CHAT_INFO, msg);
  });

  socket.on(DISCONNECT, (reason: string) => {
    const user: User = users.get(socket.id);
    if (user) {
      const msg = `${user.name} left chat! (Reason ${reason})`;
      socket.broadcast.emit(CHAT_INFO, msg);
      users.delete(socket.id);
    }
  });
}
