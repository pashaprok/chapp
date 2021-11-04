import { Request, Response } from 'express';
import UserModel, { User } from '../models/user.model';
import { Unauthorized } from 'http-errors';

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
  return res.status(200).render('my-profile', {
    title: 'Account info',
    user,
  });
}

export async function chatRoom(req: Request, res: Response) {
  const user: User = await currentUser(req);
  return res.status(200).render('chat-room', {
    title: 'Chat room',
    user,
  });
}
