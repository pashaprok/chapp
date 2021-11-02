import express, { Application, Request, Response } from 'express';
import { Server } from 'socket.io';
import http from 'http';
import { catchErrors } from './middlewares/catchErrors';
import chatRoomRouter from './routes/chatRoom.router';
import usersRouter from './routes/users.router';
import path from 'path';
import { CONNECT } from './constants/socketio';
import { socketIOService } from './services/socketIO.service';
import passport from 'passport';

const appExpress: Application = express();
const HttpServer: http.Server = http.createServer(appExpress);
export const appSocketIO = new Server(HttpServer);

appExpress.use(express.json());
appExpress.use(express.static(path.join(__dirname, '../resources/static')));
appExpress.use(passport.initialize());

appExpress.use('/users', usersRouter);
appExpress.use('/chatroom', chatRoomRouter);
appExpress.get(
  '/',
  passport.authenticate('jwt'), // protected by passport-jwt
  (req: Request, res: Response) => {
    res.send("hello, world! i'm chapp");
  },
);

appExpress.use(catchErrors);

appSocketIO.on(CONNECT, socketIOService);

export default HttpServer;
