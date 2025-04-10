import chalk, { ChalkInstance } from 'chalk';
import { loggingEventEmitter, LogLevel } from './logger.js';

export class LogPrinter {
  private enabledLevels: Set<LogLevel>;

  constructor(
    private header: string,
    enabledLevels: LogLevel[] = [
      'log',
      'info',
      'error',
      'warn',
      'debug',
      'verbose',
      'fatal',
    ]
  ) {
    this.enabledLevels = new Set(enabledLevels);
    loggingEventEmitter.on('log', (data) => this.handleLog(data));
  }

  private static colors: Record<LogLevel, ChalkInstance> = {
    log: chalk.green,
    info: chalk.blue,
    error: chalk.red,
    warn: chalk.rgb(227, 71, 37),
    debug: chalk.rgb(187, 154, 247),
    verbose: chalk.cyan,
    fatal: chalk.red.bold,
  };

  private formatLog(
    level: LogLevel,
    message: any,
    context: string,
    timestamp: string
  ): string {
    const color = LogPrinter.colors[level];
    let formattedMessage =
      typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
    let logString = `${chalk.green(this.header)} - ${chalk.white(
      timestamp
    )} ${color(level.toUpperCase().padStart(7))}`;

    if (context) {
      logString += ` ${chalk.yellow(`[${context}]`)}`;
    }

    logString += ` ${color(formattedMessage)}`;
    return logString;
  }

  private handleLog({
    level,
    message,
    context,
    timestamp,
  }: {
    level: LogLevel;
    message: any;
    context: string;
    timestamp: string;
  }) {
    if (!this.enabledLevels.has(level)) return;
    if (level === 'error' || level === 'fatal') {
      console.error(this.formatLog(level, message, context, timestamp));
    } else {
      console.log(this.formatLog(level, message, context, timestamp));
    }
  }

  enable(level: LogLevel) {
    this.enabledLevels.add(level);
  }

  disable(level: LogLevel) {
    this.enabledLevels.delete(level);
  }
}
