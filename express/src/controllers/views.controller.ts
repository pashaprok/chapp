import { Request, Response } from 'express';
import UserModel, { User } from '../models/user.model';
import { Forbidden, Unauthorized } from 'http-errors';
import { URL_SPLITTER } from '../constants/socketio';

function currentUser(req: Request) {
  if (!req.user) throw new Unauthorized('You are not logged in!');
  return UserModel.findById(req.user._id);
}

function checkLoggedIn(req: Request, res: Response, page: string, opts) {
  if (res.locals.user) {
    req.user = res.locals.user;
    return res.redirect('/v1/my-profile');
  } else {
    return res.status(200).render(page, opts);
  }
}

export async function getLoginForm(req: Request, res: Response) {
  const page = 'login';
  const opts = { title: 'Log into your account' };
  checkLoggedIn(req, res, page, opts);
}

export async function getSignupForm(req: Request, res: Response) {
  const page = 'signup';
  const opts = { title: 'Create your account' };
  checkLoggedIn(req, res, page, opts);
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
