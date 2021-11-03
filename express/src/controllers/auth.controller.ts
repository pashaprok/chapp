import { Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  VerifiedCallback,
} from 'passport-jwt';
import bcrypt from 'bcrypt';
import { authConfig } from '../config/auth';
import UserModel, { User } from '../models/user.model';
import { Unauthorized } from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import {
  validation,
  ValidationErrorI,
  validationFail,
} from '../utils/validation';

const createToken = (user: User) => {
  const sub = user._id;
  return jwt.sign({ sub }, authConfig.jwt.secret, {
    expiresIn: authConfig.jwt.expire * 60,
  });
};

export async function registerUser(req: Request, res: Response) {
  const newUser: User = req.body;

  const validateUser: ValidationErrorI[] = await validation(newUser, User);
  if (validateUser) {
    return validationFail(validateUser, res);
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

  const response: User = await UserModel.create(newUser);
  const token = createToken(response);

  return res.status(200).json({
    status: 'success',
    data: response,
    token,
  });
}

export async function loginUser(req: Request, res: Response) {
  const { email, password } = req.body;

  const userFound: User = await UserModel.findOne({ email });

  if (!userFound || !(await bcrypt.compare(password, userFound.password))) {
    throw new Unauthorized('Incorrect password or email');
  } else {
    const token = createToken(userFound);
    return res.status(200).json({
      status: 'success',
      data: userFound,
      token,
    });
  }
}

passport.use(
  'jwt',
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
