import 'reflect-metadata';
import 'express-async-errors';
import { appConfig } from './config/app';
import app from './app';

app.listen(appConfig.port, () => {
  console.log(`app running on port ${appConfig.port}...`);
});
