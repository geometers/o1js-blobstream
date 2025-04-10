import { EventEmitter } from 'events';

export type LogLevel =
  | 'log'
  | 'info'
  | 'error'
  | 'warn'
  | 'debug'
  | 'verbose'
  | 'fatal';

interface LogMessage {
  level: LogLevel;
  message: any;
  context: string;
  timestamp: string;
}

export const loggingEventEmitter = new EventEmitter();

export class Logger {
  constructor(private context: string) {}

  private emitLog(level: LogLevel, message: any) {
    const log: LogMessage = {
      level,
      message,
      context: this.context,
      timestamp: new Date().toISOString(),
    };
    loggingEventEmitter.emit('log', log);
  }

  log(message: any) {
    this.emitLog('log', message);
  }

  info(message: any) {
    this.emitLog('info', message);
  }

  warn(message: any) {
    this.emitLog('warn', message);
  }

  debug(message: any) {
    this.emitLog('debug', message);
  }

  verbose(message: any) {
    this.emitLog('verbose', message);
  }

  fatal(message: any) {
    this.emitLog('fatal', message);
  }

  error(message: any) {
    this.emitLog('error', message);
  }
}
