import { Socket } from 'socket.io';
import { PRIVATE_JOIN, USER_JOIN } from '../constants/socketio';
import { User } from '../models/user.model';
import { userJoinGeneral } from './generalChat.events';
import { userJoinToPrivate } from './privateChat.events';

export function socketIOService(socket: Socket) {
  // general chat
  socket.on(USER_JOIN, async (user: User) => {
    await userJoinGeneral(socket, user);
  });

  // private chat
  socket.on(PRIVATE_JOIN, async (roomName: string, user: User) => {
    await userJoinToPrivate(socket, roomName, user);
  });
}
