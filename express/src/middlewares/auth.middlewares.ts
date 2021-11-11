import passport from 'passport';
import {
  ExtractJwt,
  JwtFromRequestFunction,
  Strategy as JwtStrategy,
  VerifiedCallback,
} from 'passport-jwt';
import { authConfig } from '../config/auth';
import UserModel, { User } from '../models/user.model';
import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export async function isLoggedIn(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token: string = cookieExtractor(req);
  if (!token) return next();

  const decodedToken: string | JwtPayload = jwt.decode(token);
  if (!decodedToken || !decodedToken.sub) return next();

  const currentUser: User = await UserModel.findById(decodedToken.sub);
  if (currentUser) res.locals.user = currentUser;

  return next();
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
