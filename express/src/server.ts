import 'reflect-metadata';
import 'express-async-errors';
import { appConfig } from './config/app';
import HttpServer from './app';
import mongoose from 'mongoose';
import { mongodbConfig } from './config/mongodb';

HttpServer.listen(appConfig.port, async () => {
  console.log(`Server is running on port ${appConfig.port}...`);
  await mongoose.connect(mongodbConfig.link);
  console.log('Database is connected...');
});
