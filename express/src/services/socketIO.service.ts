import { appSocketIO } from '../app';
import {
  CHAT_INFO,
  DISCONNECT,
  RECEIVE_CHAT_MSG,
  SEND_CHAT_MSG,
  SHOW_USERS_LIST,
  USER_JOIN,
} from '../constants/socketio';
import { User } from '../models/user.model';
import { Socket } from 'socket.io';

const usersInChat: Map<string, User> = new Map<string, User>();

function checkUserId(candidateId: string): boolean {
  let check = false;
  usersInChat.forEach((user: User) => {
    if (user._id === candidateId) check = true;
  });

  return check;
}

const namesInChat = () => {
  return Array.from(usersInChat.values()).map((user) => user.name);
};

export function socketIOService(socket: Socket) {
  socket.on(USER_JOIN, (user: User | undefined) => {
    if (user) {
      if (!checkUserId(user._id)) {
        usersInChat.set(socket.id, user);
        const msg = `${user.name} is connected!`;
        const msgMe = 'You are connected!';

        socket.emit(CHAT_INFO, msgMe);
        socket.broadcast.emit(CHAT_INFO, msg);
      }
      appSocketIO.emit(SHOW_USERS_LIST, namesInChat());

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
    const user: User = usersInChat.get(socket.id);
    if (user) {
      usersInChat.delete(socket.id);

      if (!checkUserId(user._id)) {
        appSocketIO.emit(SHOW_USERS_LIST, namesInChat());
        const msg = `${user.name} left chat! (Reason ${reason})`;
        socket.broadcast.emit(CHAT_INFO, msg);
      }
    }
  });
}
