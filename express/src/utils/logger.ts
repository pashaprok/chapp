import path from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Format } from 'logform';
import winston, { format, Logger, LoggerOptions } from 'winston';

class InfoLogger {
  private readonly logName: string;

  private readonly transportRotate: DailyRotateFile;

  private readonly formatLogger;

  private readonly format: Format;

  public readonly logger: Logger;

  constructor(logName) {
    this.formatLogger = format;
    this.logName = logName;
    this.transportRotate = this.createTransportRotate();
    this.format = this.formatLogs();
    this.logger = this.createLogger();
  }

  private createTransportRotate() {
    return new DailyRotateFile({
      dirname: path.join(__dirname, 'logs'),
      filename: `${this.logName}-%DATE%.log`,
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    });
  }

  private formatLogs() {
    return this.formatLogger.printf(
      ({ level, message, timestamp, ...metadata }) => {
        let msg = `${timestamp} [${level}] : ${message} `;
        if (metadata) {
          msg += JSON.stringify(metadata);
        }
        return msg;
      },
    );
  }

  private createLogger() {
    const loggerOpts: LoggerOptions = {
      format: this.formatLogger.combine(
        format.colorize(),
        this.formatLogger.splat(),
        this.formatLogger.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
        this.format,
      ),
      transports: [new winston.transports.Console(), this.transportRotate],
    };

    return winston.createLogger(loggerOpts);
  }
}

export const appWorkLogger: Logger = new InfoLogger('app-work').logger;
export const usersActivitiesLogger: Logger = new InfoLogger('users-activities')
  .logger;
