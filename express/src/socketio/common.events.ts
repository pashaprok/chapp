import { v4 as uuidv4 } from 'uuid';
import { appSocketIO } from '../app';
import {
  CHAT_INFO,
  GENERAL_CHAT_ID,
  RECEIVE_GENERAL_MSGS_DB,
  RECEIVE_PRIVATE_MSGS_DB,
} from '../constants/socketio';
import ChatModel, { Chat } from '../models/chat.model';
import MessageModel, { Message } from '../models/message.model';

export function chatInfo(message: string) {
  appSocketIO.emit(CHAT_INFO, message);
}

export async function loadMsgsFromDB(
  socketId: string,
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
    chatDBID === GENERAL_CHAT_ID
      ? appSocketIO.to(socketId).emit(RECEIVE_GENERAL_MSGS_DB, messagesInChat)
      : appSocketIO.to(socketId).emit(RECEIVE_PRIVATE_MSGS_DB, messagesInChat);
  }
}

export async function saveMsgToDB(msg: Partial<Message>) {
  await MessageModel.create({
    _id: uuidv4(),
    chat: msg.chat,
    author: msg.author,
    txt: msg.txt,
    msgDate: new Date(msg.msgDate),
  });
}
