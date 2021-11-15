import express, { Application, Request, Response } from 'express';
import { Server } from 'socket.io';
import http from 'http';
import { catchErrors } from './middlewares/catchErrors';
import usersRouter from './routes/users.router';
import viewsRouter from './routes/views.router';
import path from 'path';
import { CONNECT } from './constants/socketio';
import { socketIOService } from './socketio/socketIO.service';
import passport from 'passport';
import cookieParser from 'cookie-parser';

const appExpress: Application = express();
const HttpServer: http.Server = http.createServer(appExpress);
export const appSocketIO = new Server(HttpServer);

appExpress.set('view engine', 'pug');
appExpress.set('views', path.join(__dirname, '../resources/static'));

appExpress.use(express.json());
appExpress.use(cookieParser());

appExpress.use(
  '/static',
  express.static(path.join(__dirname, '../resources/static')),
);

appExpress.use(passport.initialize());

appExpress.use('/v1', viewsRouter);
appExpress.use('/users', usersRouter);
appExpress.get('/', (req: Request, res: Response) => {
  return res.redirect('/v1/login');
});

appExpress.use(catchErrors);

appSocketIO.on(CONNECT, socketIOService);

export default HttpServer;
