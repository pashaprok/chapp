import { appSocketIO } from '../app';
import {
  CHAT_INFO,
  DISCONNECT,
  GENERAL_CHAT_ID,
  RECEIVE_CHAT_MSG,
  RECEIVE_GENERAL_MSGS_DB,
  SEND_CHAT_MSG,
  SHOW_USERS_LIST,
  USER_TYPING_INGENERAL,
  USER_TYPING_SHOW_INGENERAL,
} from '../constants/socketio';
import MessageModel, { Message } from '../models/message.model';
import UserModel, { User } from '../models/user.model';
import { v4 as uuidv4 } from 'uuid';
import { Socket } from 'socket.io';
import ChatModel, { Chat } from '../models/chat.model';
import { chatInfo } from './common.events';

const usersInChat: Map<string, User> = new Map<string, User>();

function checkUserId(candidateId: string): boolean {
  let check = false;
  usersInChat.forEach((user: User) => {
    if (user._id === candidateId) check = true;
  });

  return check;
}

const namesInChat = () => {
  return Array.from(usersInChat.values()).map((user: User) => user.name);
};

export async function userJoinGeneral(socket: Socket, user: User | undefined) {
  if (user) {
    if (!checkUserId(user._id)) {
      usersInChat.set(socket.id, user);
    }

    appSocketIO.emit(SHOW_USERS_LIST, namesInChat());
    await loadMsgsFromDBGeneral(socket);
    notificateConnectionInGeneral(socket, user);

    socket.on(USER_TYPING_INGENERAL, (userTyping: User, isTyping: boolean) =>
      usersTypingInGeneral(socket, userTyping, isTyping, user),
    );

    socket.on(DISCONNECT, (reason: string) =>
      userDisconnectGeneral(socket, reason),
    );

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

export function userDisconnectGeneral(socket: Socket, why: string) {
  const user: User = usersInChat.get(socket.id);
  if (user) {
    usersInChat.delete(socket.id);

    if (!checkUserId(user._id)) {
      appSocketIO.emit(SHOW_USERS_LIST, namesInChat());
      const msg = `${user.name} left chat! (Reason ${why})`;
      socket.broadcast.emit(CHAT_INFO, msg);
    }
  }
}

export async function sendMsgInGeneral(
  message: string,
  user: User,
  date: Date,
) {
  const msgTime = new Date(date).toLocaleTimeString();
  appSocketIO.emit(RECEIVE_CHAT_MSG, message, user, msgTime);

  await MessageModel.create({
    _id: uuidv4(),
    chat: GENERAL_CHAT_ID,
    author: user._id,
    txt: message,
    msgDate: new Date(date),
  });
}

export function usersTypingInGeneral(
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

export async function loadMsgsFromDBGeneral(socket: Socket) {
  const chatInDB: Chat = await ChatModel.findOne({ _id: GENERAL_CHAT_ID });

  if (!chatInDB) {
    await ChatModel.create({
      _id: GENERAL_CHAT_ID,
    });
  }

  const messagesInChat: Message[] = await MessageModel.find({
    chat: GENERAL_CHAT_ID,
  }).sort({ msgDate: 'asc' });

  if (messagesInChat.length) {
    for (let i = 0; i < messagesInChat.length; i++) {
      messagesInChat[i].author = await UserModel.findById(
        messagesInChat[i].author,
      );
    }

    appSocketIO.to(socket.id).emit(RECEIVE_GENERAL_MSGS_DB, messagesInChat);
  }
}
