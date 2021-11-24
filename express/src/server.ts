import 'reflect-metadata';
import 'express-async-errors';
import mongoose from 'mongoose';
import { appConfig } from './config/app';
import HttpServer from './app';
import { mongodbConfig } from './config/mongodb';
import { appWorkLogger } from './utils/logger';

// import os from 'os';
// const hostname = os.hostname();

const hostname = 'localhost'; // dev

HttpServer.listen(appConfig.port, async () => {
  appWorkLogger.info(
    `Server started and running on http://${hostname}:${appConfig.port}`,
  );
  await mongoose.connect(mongodbConfig.localDB);
  appWorkLogger.info('Database is connected...');
});
