import mongoose from 'mongoose';
import { Request, Response } from 'express';
import UserModel, { User } from '../models/user.model';
import { usersActivitiesLogger } from '../utils/logger';

export async function getAllUsers(req: Request, res: Response) {
  const users: User[] = await UserModel.find();
  return res.status(200).json({
    status: 'success',
    data: users,
  });
}

export async function getMe(req: Request, res: Response) {
  const { _id } = req.user;
  const user: User = await UserModel.findOne({ _id });
  return res.status(200).json({
    status: 'success',
    data: user,
  });
}

export async function getOneById(req: Request, res: Response) {
  const _id: string = req.params._id;
  const user: User = await UserModel.findOne({ _id });
  return res.status(200).json({
    status: 'success',
    data: user,
  });
}

export async function deleteMe(req: Request, res: Response) {
  const _id: mongoose.Types.ObjectId = req.user._id;
  const user: User = await UserModel.findOne({ _id });
  await UserModel.findOneAndRemove({ _id });

  usersActivitiesLogger.info(
    `User (${user.name}, email - ${user.email}) was deleted!`,
  );

  return res.status(204);
}

export async function updateMe(req: Request, res: Response) {
  const _id: mongoose.Types.ObjectId = req.user._id;
  const updateFields: Partial<User> = req.body;
  await UserModel.findOneAndUpdate({ _id }, updateFields);
  await getMe(req, res);
}
