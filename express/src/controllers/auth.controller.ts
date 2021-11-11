import { Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import {
  ExtractJwt,
  JwtFromRequestFunction,
  Strategy as JwtStrategy,
  VerifiedCallback,
} from 'passport-jwt';
import bcrypt from 'bcrypt';
import { authConfig } from '../config/auth';
import UserModel, { User } from '../models/user.model';
import { Unauthorized } from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import { validation } from '../services/validation';
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
  const validationCheck = await validation(newUser, User, res);
  if (validationCheck) {
    return validationCheck;
  }

  const emailExist: User = await UserModel.findOne({
    email: newUser.email,
  });
  if (emailExist) throw new Unauthorized('This email is already exist!');

  newUser.password = await bcrypt.hash(
    newUser.password,
    authConfig.bcrypt.saltRounds,
  );

  newUser._id = uuidv4();

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
  const validationCheck = await validation(req.body, User, res, true);
  if (validationCheck) {
    return validationCheck;
  }

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

export function logoutUser(req: Request, res: Response) {
  res.cookie('jwt', 'logged-out', {
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
}

const cookieExtractor: JwtFromRequestFunction = (req: Request) => {
  let jwt = null;
  if (req && req.cookies) jwt = req.cookies['jwt'];
  return jwt;
};

function jwtExtractFromRequest() {
  return ExtractJwt.fromExtractors([
    cookieExtractor,
    ExtractJwt.fromAuthHeaderAsBearerToken(),
  ]);
}

passport.use(
  'jwt',
  new JwtStrategy(
    {
      jwtFromRequest: jwtExtractFromRequest(),
      secretOrKey: authConfig.jwt.secret,
    },
    async function (jwt_payload, done: VerifiedCallback) {
      const user: User = await UserModel.findById(jwt_payload.sub);

      return user ? done(null, user) : done(null, false);
    },
  ),
);

passport.serializeUser((user: Express.User, done) => {
  done(null, user._id);
});

passport.deserializeUser(async function (id: string, done) {
  const user: User = await UserModel.findById(id);
  done(null, user);
});
