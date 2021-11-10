import { Request, Response } from 'express';
import UserModel, { User } from '../models/user.model';
import { Forbidden, Unauthorized } from 'http-errors';
import { URL_SPLITTER } from '../constants/socketio';

function currentUser(req: Request) {
  const authUser = req.user._id;
  if (!authUser) throw new Unauthorized('You are not logged in!');
  return UserModel.findById(authUser);
}

export function getLoginForm(req: Request, res: Response) {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
}

export function getSignupForm(req: Request, res: Response) {
  res.status(200).render('signup', {
    title: 'Create your account',
  });
}

export async function getMyProfile(req: Request, res: Response) {
  const user: User = await currentUser(req);
  const others: User[] = await UserModel.find({ _id: { $ne: user._id } });
  return res.status(200).render('my-profile', {
    title: 'Account info',
    user,
    others,
  });
}

export async function chatRoom(req: Request, res: Response) {
  const user: User = await currentUser(req);
  return res.status(200).render('chat-room', {
    title: 'Chat room',
    user,
  });
}

export async function privateRoom(req: Request, res: Response) {
  const urlArr = req.originalUrl.split('/');
  const urlIds = urlArr[urlArr.length - 1].split(URL_SPLITTER);
  const user: User = await currentUser(req);
  const anotherUser: User = await UserModel.findOne({ _id: urlIds[1] });

  if (!urlIds.includes(user._id))
    throw new Forbidden("It's not your chat, go away!");

  return res.status(200).render('private-room', {
    title: `Private room(${user.name} - ${anotherUser.name})`,
    user,
    anotherUser,
  });
}
