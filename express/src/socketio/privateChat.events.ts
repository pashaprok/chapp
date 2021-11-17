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
import { appSocketIO } from '../app';
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

  userExistInPrivate(candidate: string) {
    for (let i = 0; i < this.privateList.length; i++) {
      if (this.privateList[i] === candidate) return true;
    }
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

export async function userJoinToPrivate(
  socket: Socket,
  roomName: string,
  user: User,
) {
  const allow: boolean = checkRoomName(socket.id, roomName);

  if (user && allow) {
    const PrivateInfo = new PrivateMessagingInfo(socket, roomName);
    PrivateInfo.privateFilter();

    if (PrivateInfo.userExistInPrivate(user._id)) {
      socket.join(PrivateInfo.updatedRoomName);

      await loadMsgsFromDB(
        socket.id,
        PrivateInfo.chatID,
        PrivateInfo.privateList,
      );

      socket
        .to(PrivateInfo.updatedRoomName)
        .emit(PRIVATE_INFO, `${user.name} is connected!`);

      socket.on(DISCONNECT, (reason: string) =>
        userDisconnectPrivate(
          socket,
          reason,
          user,
          PrivateInfo.updatedRoomName,
        ),
      );
    } else {
      appSocketIO
        .to(socket.id)
        .emit(PRIVATE_INFO, "It's not your chat! Go away!");
    }

    socket.on(USER_TYPING, (user: User, isTyping: boolean) => {
      socket.broadcast.emit(USER_TYPING_SHOW, user, isTyping);
    });

    socket.on(
      SEND_PRIVATE_MSG,
      async (msg: string, sender: User, date: Date) =>
        await sendPrivateMsg(socket, PrivateInfo.chatID, msg, sender, date),
    );

    socket.on(PRIVATE_INFO, (msg: string) => chatInfo(msg));
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

  for (const id of Array.from(socket.rooms).filter((it) => it !== socket.id)) {
    appSocketIO.to(id).emit(RECEIVE_PRIVATE_MSG, msg, sender, msgTime);

    await saveMsgToDB({
      chat: chatDBID,
      author: sender._id,
      txt: msg,
      msgDate: date,
    });
  }
}

function checkRoomName(s: string, roomName: string) {
  if (roomName.split(URL_SPLITTER).length === 2) {
    return true;
  }

  appSocketIO.to(s).emit(PRIVATE_INFO, 'Incorrect room name!');
  return false;
}
