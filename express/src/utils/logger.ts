import winston, { format, Logger, LoggerOptions } from 'winston';
const { combine, splat, timestamp, printf } = format;
import path from 'path';

const myFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] : ${message} `;
  if (metadata) {
    msg += JSON.stringify(metadata);
  }
  return msg;
});

function loggerOpts(logName): LoggerOptions {
  return {
    format: combine(
      format.colorize(),
      splat(),
      timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
      myFormat,
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({
        dirname: path.join(__dirname, 'logs'),
        filename: `${logName}.log`,
      }),
    ],
  };
}

const appWorkOpts = loggerOpts('app-work');
const usersActivitiesOpts = loggerOpts('users-activities');

export const appWorkLogger: Logger = winston.createLogger(appWorkOpts);
export const usersActivitiesLogger: Logger =
  winston.createLogger(usersActivitiesOpts);
