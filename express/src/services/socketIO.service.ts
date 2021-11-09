import { appSocketIO } from '../app';
import {
  CHAT_INFO,
  DISCONNECT,
  PRIVATE_INFO,
  RECEIVE_CHAT_MSG,
  RECEIVE_PRIVATE_MSG,
  SEND_CHAT_MSG,
  SEND_PRIVATE_MSG,
  SHOW_USERS_LIST,
  USER_JOIN,
} from '../constants/socketio';
import { User } from '../models/user.model';
import { Socket } from 'socket.io';

// general
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

// private
type PrivateList = [string, string];

function checkUserInPrivate(candidate: string, list: PrivateList): boolean {
  for (let i = 0; i < list.length; i++) {
    if (list[i] == candidate) return true;
  }
}

// service
export function socketIOService(socket: Socket) {
  // general chat ---start
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

  socket.on('private-chat-info', (msg) => {
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
  // general chat ---end

  socket.on('join-private', (roomName: string, user: User) => {
    const split: string[] = roomName.split('-htiw-');
    if (user && split.length == 2) {
      const unique: PrivateList = [split[0], split[1]];
      const privateList: string[] = [...new Set(unique)].sort((a, b) =>
        a < b ? -1 : 1,
      ); // ['username1', 'username2']
      const updatedRoomName = `${privateList[0]}--with--${privateList[1]}`; // 'username1--with--username2'

      // only unique private room(filter)
      Array.from(socket.rooms)
        .filter((it) => it !== socket.id)
        .forEach((id) => {
          socket.leave(id);
          socket.removeAllListeners();
        });

      if (checkUserInPrivate(user._id, unique)) {
        socket.join(updatedRoomName);
      }

      socket
        .to(updatedRoomName)
        .emit(PRIVATE_INFO, `${user.name} is connected!`);

      socket.on(SEND_PRIVATE_MSG, (msg: string, sender: User) => {
        const text = `${user.name}: ${msg}`;
        Array.from(socket.rooms)
          .filter((it) => it !== socket.id)
          .forEach((id) => {
            appSocketIO.to(id).emit(RECEIVE_PRIVATE_MSG, text, sender);
          });
      });
    }
  });
}
