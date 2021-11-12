import { appSocketIO } from '../app';
import {
  CHAT_INFO,
  DISCONNECT,
  GENERAL_CHAT_ID,
  PRIVATE_INFO,
  RECEIVE_CHAT_MSG,
  RECEIVE_GENERAL_MSGS_DB,
  RECEIVE_PRIVATE_MSG,
  RECEIVE_PRIVATE_MSGS_DB,
  SEND_CHAT_MSG,
  SEND_PRIVATE_MSG,
  SHOW_USERS_LIST,
  URL_SPLITTER,
  USER_JOIN,
  USER_TYPING,
  USER_TYPING_INGENERAL,
  USER_TYPING_SHOW,
  USER_TYPING_SHOW_INGENERAL,
} from '../constants/socketio';
import UserModel, { User } from '../models/user.model';
import ChatModel, { Chat } from '../models/chat.model';
import MessageModel, { Message } from '../models/message.model';
import { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// ----- general -----
const usersInChat: Map<string, User> = new Map<string, User>();

function checkUserId(candidateId: string): boolean {
  let check = false;
  usersInChat.forEach((user: User) => {
    if (user._id === candidateId) check = true;
  });

  return check;
}

// return users names
const namesInChat = () => {
  return Array.from(usersInChat.values()).map((user: User) => user.name);
};

// ----- private -----
type PrivateList = [string, string];

function checkUserInPrivate(candidate: string, list: PrivateList): boolean {
  for (let i = 0; i < list.length; i++) {
    if (list[i] == candidate) return true;
  }
}

// service
export function socketIOService(socket: Socket) {
  // general chat ---start
  socket.on(USER_JOIN, async (user: User | undefined) => {
    if (user) {
      if (!checkUserId(user._id)) {
        usersInChat.set(socket.id, user);
        const msg = `${user.name} is connected!`;
        const msgMe = 'You are connected!';

        socket.emit(CHAT_INFO, msgMe);
        socket.broadcast.emit(CHAT_INFO, msg);
      }
      appSocketIO.emit(SHOW_USERS_LIST, namesInChat());

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

      socket.on(
        USER_TYPING_INGENERAL,
        (userTyping: User, isTyping: boolean) => {
          const typingUsers: Set<User> = new Set<User>();

          if (isTyping) {
            typingUsers.add(userTyping);
          } else {
            typingUsers.delete(userTyping);
          }

          if (typingUsers.size) {
            const listBroadcast: User[] = Array.from(typingUsers);
            const listMe: User[] = listBroadcast.filter(
              (u: User) => u === user,
            );

            socket.emit(USER_TYPING_SHOW_INGENERAL, listMe);
            socket.broadcast.emit(USER_TYPING_SHOW_INGENERAL, listBroadcast);
          } else {
            socket.emit(USER_TYPING_SHOW_INGENERAL, []);
            socket.broadcast.emit(USER_TYPING_SHOW_INGENERAL, []);
          }
        },
      );

      socket.on(
        SEND_CHAT_MSG,
        async (msg: string, sender: User, date: Date) => {
          const msgTime = new Date(date).toLocaleTimeString();
          appSocketIO.emit(RECEIVE_CHAT_MSG, msg, sender, msgTime);

          await MessageModel.create({
            _id: uuidv4(),
            chat: GENERAL_CHAT_ID,
            author: sender._id,
            txt: msg,
            msgDate: new Date(date),
          });
        },
      );
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

  socket.on('join-private', async (roomName: string, user: User) => {
    const split: string[] = roomName.split(URL_SPLITTER);
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
      const chatDBID = privateList.join('--');

      const chatInDB: Chat = await ChatModel.findOne({
        _id: chatDBID,
      });
      if (!chatInDB) {
        await ChatModel.create({
          _id: chatDBID,
          usersIn: privateList,
        });
      }

      const messagesInChat: Message[] = await MessageModel.find({
        chat: chatDBID,
      }).sort({ msgDate: 'asc' });

      if (messagesInChat.length) {
        for (let i = 0; i < messagesInChat.length; i++) {
          messagesInChat[i].author = await UserModel.findById(
            messagesInChat[i].author,
          );
        }

        appSocketIO.to(socket.id).emit(RECEIVE_PRIVATE_MSGS_DB, messagesInChat);
      }

      socket
        .to(updatedRoomName)
        .emit(PRIVATE_INFO, `${user.name} is connected!`);

      socket.on(USER_TYPING, (user: User, isTyping: boolean) => {
        socket.broadcast.emit(USER_TYPING_SHOW, user, isTyping);
      });

      socket.on(SEND_PRIVATE_MSG, (msg: string, sender: User, date: Date) => {
        const msgTime = new Date(date).toLocaleTimeString();

        Array.from(socket.rooms)
          .filter((it) => it !== socket.id)
          .forEach(async (id) => {
            appSocketIO.to(id).emit(RECEIVE_PRIVATE_MSG, msg, sender, msgTime);

            await MessageModel.create({
              _id: uuidv4(),
              chat: chatDBID,
              author: sender._id,
              txt: msg,
              msgDate: new Date(date),
            });
          });
      });
    }
  });
}
