import passport from 'passport';
import {
  ExtractJwt,
  JwtFromRequestFunction,
  Strategy as JwtStrategy,
  VerifiedCallback,
} from 'passport-jwt';
import { Request } from 'express';
import { authConfig } from '../config/auth';
import UserModel, { User } from '../models/user.model';

const cookieExtractor: JwtFromRequestFunction = (req: Request) => {
  let t = null;
  if (req && req.cookies) t = req.cookies.jwt;
  return t;
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
    async (jwt_payload, done: VerifiedCallback) => {
      const user: User = await UserModel.findById(jwt_payload.sub);

      return user ? done(null, user) : done(null, false);
    },
  ),
);

passport.serializeUser((user: Express.User, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  const user: User = await UserModel.findById(id);
  done(null, user);
});
