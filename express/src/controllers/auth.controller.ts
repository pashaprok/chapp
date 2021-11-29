import { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { Unauthorized } from 'http-errors';
import { authConfig } from '../config/auth';
import UserModel, { User } from '../models/user.model';
import { usersActivitiesLogger } from '../utils/logger';
import { authJWT, JWTLogic } from '../middlewares/jwt';

export async function registerUser(req: Request, res: Response) {
  const newUser: User = req.body;

  const emailExist: User = await UserModel.findOne({
    email: newUser.email,
  });
  if (emailExist) throw new Unauthorized('This email is already exist!');

  newUser.password = await bcrypt.hash(
    newUser.password,
    authConfig.bcrypt.saltRounds,
  );

  newUser._id = new mongoose.Types.ObjectId();

  const user: User = await UserModel.create(newUser);
  const { accessToken, refreshToken } = await authJWT(res, user);

  usersActivitiesLogger.info(
    `New user registered with: name - ${user.name}, email - ${user.email}, and id - ${user._id}`,
  );

  return res.status(200).json({
    status: 'success',
    data: user,
    accessToken,
    refreshToken,
  });
}

export async function loginUser(req: Request, res: Response) {
  const { email, password } = req.body;
  const userFound: User = await UserModel.findOne({ email });

  if (!userFound || !(await bcrypt.compare(password, userFound.password))) {
    throw new Unauthorized('Incorrect password or email');
  } else {
    const { accessToken, refreshToken } = await authJWT(res, userFound);

    usersActivitiesLogger.info(
      `User ${userFound.name} - ${userFound.email} is logged in!(id: ${userFound._id})`,
    );

    return res.status(200).json({
      status: 'success',
      data: userFound,
      accessToken,
      refreshToken,
    });
  }
}

export async function logoutUser(req: Request, res: Response) {
  const user: User = await UserModel.findById(req.user._id);

  usersActivitiesLogger.info(
    `User ${user.name} - ${user.email} is logged out!(id: ${user._id})`,
  );

  JWTLogic.destroyCookieJWT(res);
  return res.status(200).json({ status: 'success' });
}
