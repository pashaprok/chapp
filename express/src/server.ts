import 'reflect-metadata';
import 'express-async-errors';
import { appConfig } from './config/app';
import HttpServer from './app';

HttpServer.listen(appConfig.port, () => {
  console.log(`Server is running on port ${appConfig.port}...`);
});
