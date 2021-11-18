import mongoose from 'mongoose';
import { Socket } from 'socket.io';
import {
  CHAT_INFO,
  GENERAL_CHAT_ID,
  RECEIVE_GENERAL_MSGS_DB,
  RECEIVE_PRIVATE_MSGS_DB,
} from '../constants/socketio';
import ChatModel, { Chat } from '../models/chat.model';
import MessageModel, { Message } from '../models/message.model';

export function chatInfo(socket: Socket, message: string) {
  socket.emit(CHAT_INFO, message);
}

function receiveMsgsFromDB(socket: Socket, msgs: Message[], chatID: string) {
  if (chatID === GENERAL_CHAT_ID) {
    socket.emit(RECEIVE_GENERAL_MSGS_DB, msgs);
  } else {
    socket.emit(RECEIVE_PRIVATE_MSGS_DB, msgs);
  }
}

export async function loadMsgsFromDB(
  socket: Socket,
  chatDBID: string,
  listRestrict?: string[],
) {
  const chatInDB: Chat = await ChatModel.findById(chatDBID);

  if (!chatInDB) {
    const createOpts: Partial<Chat> = {
      _id: chatDBID,
    };

    if (chatDBID !== GENERAL_CHAT_ID) {
      createOpts.usersIn = listRestrict;
    }

    await ChatModel.create(createOpts);
  }

  const messagesInChat: Message[] = await MessageModel.find({
    chat: chatDBID,
  })
    .sort({ msgDate: 'asc' })
    .populate('author');

  if (messagesInChat.length) {
    receiveMsgsFromDB(socket, messagesInChat, chatDBID);
  }
}

export async function saveMsgToDB(msg: Partial<Message>) {
  await MessageModel.create({
    _id: new mongoose.Types.ObjectId(),
    chat: msg.chat,
    author: msg.author,
    txt: msg.txt,
    msgDate: new Date(msg.msgDate),
  });
}
