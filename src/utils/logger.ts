export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogContext {
  [key: string]: unknown;
}

export interface Logger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function bigIntReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const base = `${formatTimestamp()} [${level.toUpperCase()}] ${message}`;
  
  if (context && Object.keys(context).length > 0) {
    return `${base} ${JSON.stringify(context, bigIntReplacer)}`;
  }
  
  return base;
}

function createConsoleLogger(): Logger {
  const logFn = (level: LogLevel) => 
    (message: string, context?: LogContext): void => {
      const formatted = formatMessage(level, message, context);
      
      switch (level) {
        case "error":
          console.error(formatted);
          break;
        case "warn":
          console.warn(formatted);
          break;
        case "debug":
          console.debug(formatted);
          break;
        default:
          console.log(formatted);
      }
    };

  return {
    info: logFn("info"),
    warn: logFn("warn"),
    error: logFn("error"),
    debug: logFn("debug"),
  };
}

const loggerInstance: Logger = createConsoleLogger();

export const logger: Logger = {
  info: (message: string, context?: LogContext): void => {
    loggerInstance.info(message, context);
  },
  warn: (message: string, context?: LogContext): void => {
    loggerInstance.warn(message, context);
  },
  error: (message: string, context?: LogContext): void => {
    loggerInstance.error(message, context);
  },
  debug: (message: string, context?: LogContext): void => {
    loggerInstance.debug(message, context);
  },
};
