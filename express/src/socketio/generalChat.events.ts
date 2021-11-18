import mongoose from 'mongoose';
import { Socket } from 'socket.io';
import {
  CHAT_INFO,
  DISCONNECT,
  GENERAL_CHAT_ID,
  RECEIVE_CHAT_MSG,
  SEND_CHAT_MSG,
  SHOW_USERS_LIST,
  USER_TYPING_INGENERAL,
  USER_TYPING_SHOW_INGENERAL,
} from '../constants/socketio';
import { User } from '../models/user.model';
import { chatInfo, loadMsgsFromDB, saveMsgToDB } from './common.events';

class GeneralMessagingInfo {
  private nowUsersIn: Map<string, User>;

  constructor() {
    this.nowUsersIn = new Map<string, User>();
  }

  namesIn() {
    return Array.from(this.nowUsersIn.values()).map((user: User) => user.name);
  }

  checkUserIdIn(candidate: mongoose.Types.ObjectId) {
    let check = false;
    this.nowUsersIn.forEach((user: User) => {
      if (user._id === candidate) check = true;
    });

    return check;
  }

  addUserIn(socketId: string, user: User) {
    this.nowUsersIn.set(socketId, user);
  }

  removeUser(socketId: string) {
    this.nowUsersIn.delete(socketId);
  }

  getUser(socketId: string): User {
    return this.nowUsersIn.get(socketId);
  }
}

const GeneralChat = new GeneralMessagingInfo();

function notificateConnectionInGeneral(socket: Socket, user: User) {
  socket.emit(CHAT_INFO, 'You are connected!');
  socket.broadcast.emit(CHAT_INFO, `${user.name} is connected!`);
}

function userDisconnectGeneral(socket: Socket, why: string) {
  const user: User = GeneralChat.getUser(socket.id);
  if (user) {
    GeneralChat.removeUser(socket.id);

    if (!GeneralChat.checkUserIdIn(user._id)) {
      socket.broadcast.emit(SHOW_USERS_LIST, GeneralChat.namesIn());
      const msg = `${user.name} left chat! (Reason ${why})`;
      socket.broadcast.emit(CHAT_INFO, msg);
    }
  }
}

async function sendMsgInGeneral(
  socket: Socket,
  message: string,
  user: User,
  date: Date,
) {
  const msgTime = new Date(date).toLocaleTimeString();
  socket.broadcast.emit(RECEIVE_CHAT_MSG, message, user, msgTime);
  socket.emit(RECEIVE_CHAT_MSG, message, user, msgTime);

  await saveMsgToDB({
    chat: GENERAL_CHAT_ID,
    author: new mongoose.Types.ObjectId(user._id),
    txt: message,
    msgDate: date,
  });
}

function usersTypingInGeneral(
  socket: Socket,
  userTyping: User,
  isTyping: boolean,
  currentUser: User,
) {
  const typingUsers: Set<User> = new Set<User>();

  if (isTyping) {
    typingUsers.add(userTyping);
  } else {
    typingUsers.delete(userTyping);
  }

  if (typingUsers.size) {
    const listBroadcast: User[] = Array.from(typingUsers);
    const listMe: User[] = listBroadcast.filter((u: User) => u === currentUser);

    socket.emit(USER_TYPING_SHOW_INGENERAL, listMe);
    socket.broadcast.emit(USER_TYPING_SHOW_INGENERAL, listBroadcast);
  } else {
    socket.emit(USER_TYPING_SHOW_INGENERAL, []);
    socket.broadcast.emit(USER_TYPING_SHOW_INGENERAL, []);
  }
}

export async function userJoinGeneral(socket: Socket, user: User) {
  if (user) {
    if (!GeneralChat.checkUserIdIn(user._id)) {
      GeneralChat.addUserIn(socket.id, user);
    }

    socket.emit(SHOW_USERS_LIST, GeneralChat.namesIn());
    socket.broadcast.emit(SHOW_USERS_LIST, GeneralChat.namesIn());
    await loadMsgsFromDB(socket, GENERAL_CHAT_ID);
    notificateConnectionInGeneral(socket, user);

    socket.on(USER_TYPING_INGENERAL, (userTyping: User, isTyping: boolean) =>
      usersTypingInGeneral(socket, userTyping, isTyping, user),
    );

    socket.on(DISCONNECT, (reason: string) => {
      userDisconnectGeneral(socket, reason);
    });

    socket.on(SEND_CHAT_MSG, async (msg: string, sender: User, date: Date) =>
      sendMsgInGeneral(socket, msg, sender, date),
    );

    socket.on(CHAT_INFO, (msg: string) => chatInfo(socket, msg));
  }
}
