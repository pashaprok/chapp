import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { authConfig } from '../config/auth';
import UserModel, { User } from '../models/user.model';
import { Unauthorized } from 'http-errors';
import { usersActivitiesLogger } from '../utils/logger';

const createToken = (user: User, res: Response) => {
  const sub = user._id;
  const token = jwt.sign({ sub }, authConfig.jwt.secret, {
    expiresIn: authConfig.jwt.expire * 60,
  });
  res.cookie('jwt', token, {
    httpOnly: true,
    expires: new Date(Date.now() + authConfig.jwt.expire * 60 * 1000),
    secure: true,
  });
  return token;
};

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

  const user: User = await UserModel.create(newUser);
  const token = createToken(user, res);

  usersActivitiesLogger.info(
    `New user registered with: name - ${user.name}, email - ${user.email}, and id - ${user._id}`,
  );

  return res.status(200).json({
    status: 'success',
    data: user,
    token,
  });
}

export async function loginUser(req: Request, res: Response) {
  const { email, password } = req.body;
  const userFound: User = await UserModel.findOne({ email });

  if (!userFound || !(await bcrypt.compare(password, userFound.password))) {
    throw new Unauthorized('Incorrect password or email');
  } else {
    const token = createToken(userFound, res);

    usersActivitiesLogger.info(
      `User ${userFound.name} - ${userFound.email} is logged in!(id: ${userFound._id})`,
    );

    return res.status(200).json({
      status: 'success',
      data: userFound,
      token,
    });
  }
}

export async function logoutUser(req: Request, res: Response) {
  const user: User = await UserModel.findById(req.user._id);

  usersActivitiesLogger.info(
    `User ${user.name} - ${user.email} is logged out!(id: ${user._id})`,
  );

  res.cookie('jwt', 'logged-out', {
    httpOnly: true,
  });
  return res.status(200).json({ status: 'success' });
}
