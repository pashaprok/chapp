import express, { Application, Request, Response } from 'express';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';
import cookieParser from 'cookie-parser';
import { catchErrors } from './middlewares/catchErrors';
import usersRouter from './routes/users.router';
import viewsRouter from './routes/views.router';
import { CONNECT } from './constants/socketio';
import { socketIOService } from './socketio/socketIO.service';

const appExpress: Application = express();
const HttpServer: http.Server = http.createServer(appExpress);
export const appSocketIO = new Server(HttpServer);

appExpress.set('view engine', 'pug');
appExpress.set('views', path.join(__dirname, '../static'));

appExpress.use(express.json());
appExpress.use(cookieParser());

appExpress.use('/static', express.static(path.join(__dirname, '../static')));

appExpress.use('/v1', viewsRouter);
appExpress.use('/users', usersRouter);
appExpress.get('/', (req: Request, res: Response) => {
  return res.redirect('/v1/login');
});

appExpress.use(catchErrors);

appSocketIO.on(CONNECT, socketIOService);

export default HttpServer;
