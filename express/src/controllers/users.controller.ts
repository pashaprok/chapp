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
  const { _id } = req.params;
  const user: User = await UserModel.findOne({ _id });
  return res.status(200).json({
    status: 'success',
    data: user,
  });
}

export async function deleteMe(req: Request, res: Response) {
  const { _id } = req.user;
  const user: User = await UserModel.findById(new mongoose.Types.ObjectId(_id));
  await UserModel.findByIdAndRemove(new mongoose.Types.ObjectId(_id));

  usersActivitiesLogger.info(
    `User (${user.name}, email - ${user.email}) was deleted!`,
  );

  return res.status(204);
}

export async function updateMe(req: Request, res: Response) {
  const { _id } = req.user;
  const updateFields: Partial<User> = req.body;
  await UserModel.findByIdAndUpdate(
    new mongoose.Types.ObjectId(_id),
    updateFields,
  );
  await getMe(req, res);
}
