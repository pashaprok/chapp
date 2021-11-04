import { Request, Response } from 'express';
import UserModel, { User } from '../models/user.model';

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
  const authUser = req.user._id;
  const user: User = await UserModel.findById(authUser);
  return res.status(200).render('my-profile', {
    title: 'Account info',
    user,
  });
}
