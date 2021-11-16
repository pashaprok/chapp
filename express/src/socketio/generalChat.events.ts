import { appSocketIO } from '../app';
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
import { Socket } from 'socket.io';
import { chatInfo, loadMsgsFromDB, saveMsgToDB } from './common.events';

class GeneralMessagingInfo {
  private nowUsersIn: Map<string, User>;

  constructor() {
    this.nowUsersIn = new Map<string, User>();
  }

  namesIn() {
    return Array.from(this.nowUsersIn.values()).map((user: User) => user.name);
  }

  checkUserIdIn(candidate: string) {
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

export async function userJoinGeneral(socket: Socket, user: User) {
  if (user) {
    if (!GeneralChat.checkUserIdIn(user._id)) {
      GeneralChat.addUserIn(socket.id, user);
    }

    appSocketIO.emit(SHOW_USERS_LIST, GeneralChat.namesIn());
    await loadMsgsFromDB(socket.id, GENERAL_CHAT_ID);
    notificateConnectionInGeneral(socket, user);

    socket.on(USER_TYPING_INGENERAL, (userTyping: User, isTyping: boolean) =>
      usersTypingInGeneral(socket, userTyping, isTyping, user),
    );

    socket.on(DISCONNECT, (reason: string) => {
      userDisconnectGeneral(socket, reason);
    });

    socket.on(
      SEND_CHAT_MSG,
      async (msg: string, sender: User, date: Date) =>
        await sendMsgInGeneral(msg, sender, date),
    );

    socket.on(CHAT_INFO, (msg: string) => chatInfo(msg));
  }
}

function notificateConnectionInGeneral(socket: Socket, user: User) {
  socket.emit(CHAT_INFO, 'You are connected!');
  socket.broadcast.emit(CHAT_INFO, `${user.name} is connected!`);
}

function userDisconnectGeneral(socket: Socket, why: string) {
  const user: User = GeneralChat.getUser(socket.id);
  if (user) {
    GeneralChat.removeUser(socket.id);

    if (!GeneralChat.checkUserIdIn(user._id)) {
      socket.emit(SHOW_USERS_LIST, GeneralChat.namesIn());
      const msg = `${user.name} left chat! (Reason ${why})`;
      socket.broadcast.emit(CHAT_INFO, msg);
    }
  }
}

async function sendMsgInGeneral(message: string, user: User, date: Date) {
  const msgTime = new Date(date).toLocaleTimeString();
  appSocketIO.emit(RECEIVE_CHAT_MSG, message, user, msgTime);

  await saveMsgToDB({
    chat: GENERAL_CHAT_ID,
    author: user._id,
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
