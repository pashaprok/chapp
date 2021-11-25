import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { Unauthorized } from 'http-errors';
import mongoose from 'mongoose';
import UserModel, { User } from '../models/user.model';
import TokenModel from '../models/token.model';
import { authConfig } from '../config/auth';
import { mins, weeks } from '../constants/nums';

export class JWTLogic {
  readonly accessSecret = authConfig.accessToken.secret;

  readonly accessExpire = authConfig.accessToken.expire;

  readonly refreshSecret = authConfig.refreshToken.secret;

  readonly refreshExpire = authConfig.refreshToken.expire;

  private readonly user: User;

  constructor(user) {
    this.user = user;
  }

  static signToken(secret: string, expireTime: number, sub) {
    return jwt.sign({ sub }, secret, {
      expiresIn: expireTime,
    });
  }

  static setCookieJWT(res: Response, token: string, expireTime: number) {
    res.cookie('jwt', token, {
      httpOnly: true,
      expires: new Date(Date.now() + expireTime),
      secure: true,
    });
  }

  createAccessToken() {
    return JWTLogic.signToken(
      this.accessSecret,
      this.accessExpire * mins,
      this.user._id,
    );
  }

  createRefreshToken() {
    return JWTLogic.signToken(
      this.refreshSecret,
      this.refreshExpire * weeks,
      this.user._id,
    );
  }

  async saveNewRefreshToken() {
    const newRefresh = async () => {
      const token = this.createRefreshToken();
      const refresh = await TokenModel.create({
        _id: new mongoose.Types.ObjectId(),
        user: this.user._id,
        refresh: token,
      });

      return refresh.refresh;
    };

    const refreshTokenDB = await TokenModel.findOne({ user: this.user._id });

    if (!refreshTokenDB) {
      return newRefresh();
    }

    const verifyRefresh = jwt.verify(
      refreshTokenDB.refresh,
      this.refreshSecret,
    );

    if (!verifyRefresh) {
      return newRefresh();
    }

    return refreshTokenDB.refresh;
  }

  static extractJWTFromCookie(req: Request) {
    let t = null;
    if (req && req.cookies) t = req.cookies.jwt;
    return t;
  }

  static extractJWT(req: Request) {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      [, token] = req.headers.authorization.split(' ');
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      throw new Unauthorized('You are not logged in!');
    }

    return token;
  }

  static async verifyAccessToken(accessToken: string) {
    const { sub } = jwt.verify(accessToken, authConfig.accessToken.secret); // expire time
    const userID = String(sub);
    const userExist = await UserModel.findById(userID);
    if (!userExist) {
      throw new Unauthorized('You are not authorized!');
    }

    const refreshTokenDB = await TokenModel.findOne({
      user: userID,
    });
    const refreshToken = refreshTokenDB.refresh;
    // if (!refreshTokenDB) {
    //   refreshToken = await this.saveNewRefreshToken();
    // }
    const verifyRefresh = jwt.verify(
      refreshToken,
      authConfig.refreshToken.secret,
    );
    if (!verifyRefresh) {
      throw new Unauthorized('You are not authorized!');
    }

    const newAccessToken = new JWTLogic(userExist).createAccessToken();

    return {
      newAccessToken,
      user: userExist,
    };
  }
}

export async function authJWT(res: Response, user: User) {
  const jwtLogic = new JWTLogic(user);
  const accessToken = jwtLogic.createAccessToken();
  const refreshToken = await jwtLogic.saveNewRefreshToken();
  JWTLogic.setCookieJWT(res, accessToken, jwtLogic.accessExpire * mins);
  return { accessToken, refreshToken };
}

export async function verifyUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = JWTLogic.extractJWT(req);
  const { newAccessToken, user } = await JWTLogic.verifyAccessToken(token);
  JWTLogic.setCookieJWT(
    res,
    newAccessToken,
    authConfig.accessToken.expire * mins,
  );
  req.user = user;
  res.locals.user = user;

  return next();
}

export async function isLoggedIn(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token: string = JWTLogic.extractJWTFromCookie(req);
  if (!token) {
    return next();
  }

  const { newAccessToken, user } = await JWTLogic.verifyAccessToken(token);
  JWTLogic.setCookieJWT(
    res,
    newAccessToken,
    authConfig.accessToken.expire * mins,
  );
  req.user = user;
  res.locals.user = user;

  return next();
}
