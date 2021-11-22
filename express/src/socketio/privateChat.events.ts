import mongoose from 'mongoose';
import { Socket } from 'socket.io';
import {
  DISCONNECT,
  PRIVATE_INFO,
  RECEIVE_PRIVATE_MSG,
  SEND_PRIVATE_MSG,
  URL_SPLITTER,
  USER_TYPING,
  USER_TYPING_SHOW,
} from '../constants/socketio';
import { User } from '../models/user.model';
import { chatInfo, loadMsgsFromDB, saveMsgToDB } from './common.events';

type PrivateList = [string, string];

class PrivateMessagingInfo {
  private readonly splitedURL: string[];

  public readonly uniqueList: PrivateList;

  public readonly privateList: string[];

  public readonly updatedRoomName: string;

  public readonly chatID: string;

  socket: Socket;

  constructor(s, roomName) {
    this.socket = s;
    this.splitedURL = roomName.split(URL_SPLITTER);
    this.uniqueList = [this.splitedURL[0], this.splitedURL[1]];
    this.privateList = [...new Set(this.uniqueList)].sort((a, b) =>
      a < b ? -1 : 1,
    );
    this.updatedRoomName = `${this.privateList[0]}--with--${this.privateList[1]}`;
    this.chatID = this.privateList.join('--');
  }

  userExistInPrivate(candidate: mongoose.Types.ObjectId): boolean {
    let exist = false;
    for (let i = 0; i < this.privateList.length; i += 1) {
      if (this.privateList[i] === String(candidate)) {
        exist = true;
        break;
      }
    }
    return exist;
  }

  privateFilter() {
    Array.from(this.socket.rooms)
      .filter((it) => it !== this.socket.id)
      .forEach((id) => {
        this.socket.leave(id);
        this.socket.removeAllListeners();
      });
  }
}

export function userDisconnectPrivate(
  socket: Socket,
  why: string,
  user: User,
  room: string,
) {
  socket.to(room).emit(PRIVATE_INFO, `${user.name} left chat! (Reason ${why})`);
}

async function sendPrivateMsg(
  socket: Socket,
  chatDBID: string,
  msg: string,
  sender: User,
  date: Date,
) {
  const msgTime = new Date(date).toLocaleTimeString();
  socket.emit(RECEIVE_PRIVATE_MSG, msg, sender, msgTime);
  const filteredArray = Array.from(socket.rooms).filter(
    (it) => it !== socket.id,
  );

  for (let i = 0; i < filteredArray.length; i += 1) {
    const id = filteredArray[i];
    socket.to(id).emit(RECEIVE_PRIVATE_MSG, msg, sender, msgTime);

    await saveMsgToDB({
      chat: chatDBID,
      author: sender._id,
      txt: msg,
      msgDate: date,
    });
  }
}

function checkRoomName(socket: Socket, roomName: string) {
  if (roomName.split(URL_SPLITTER).length === 2) {
    return true;
  }

  socket.emit(PRIVATE_INFO, 'Incorrect room name!');
  return false;
}

export async function userJoinToPrivate(
  socket: Socket,
  roomName: string,
  user: User,
) {
  const allow: boolean = checkRoomName(socket, roomName);

  if (user && allow) {
    const PrivateInfo = new PrivateMessagingInfo(socket, roomName);
    PrivateInfo.privateFilter();

    if (PrivateInfo.userExistInPrivate(user._id)) {
      socket.join(PrivateInfo.updatedRoomName);

      await loadMsgsFromDB(socket, PrivateInfo.chatID, PrivateInfo.privateList);

      socket
        .to(PrivateInfo.updatedRoomName)
        .emit(PRIVATE_INFO, `${user.name} is connected!`);

      socket.on(USER_TYPING, (userTyping: User, isTyping: boolean) => {
        socket.broadcast.emit(USER_TYPING_SHOW, userTyping, isTyping);
      });

      socket.on(DISCONNECT, (reason: string) =>
        userDisconnectPrivate(
          socket,
          reason,
          user,
          PrivateInfo.updatedRoomName,
        ),
      );
    } else {
      socket.emit(PRIVATE_INFO, "It's not your chat! Go away!");
    }

    socket.on(SEND_PRIVATE_MSG, async (msg: string, sender: User, date: Date) =>
      sendPrivateMsg(socket, PrivateInfo.chatID, msg, sender, date),
    );

    socket.on(PRIVATE_INFO, (msg: string) => chatInfo(socket, msg));
  }
}
