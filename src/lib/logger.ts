/**
 * Structured logging system with configurable log levels and output formats
 * Integrates with the existing error handler and configuration system
 */

import { config } from '../config';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export type LogContext = {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  timestamp?: Date;
  [key: string]: unknown;
};

export type LogEntry = {
  level: LogLevel;
  message: string;
  context?: LogContext;
  data?: unknown;
  timestamp: Date;
  error?: Error;
};

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStructuredLogging: boolean;
  includeTimestamp: boolean;
  includeStackTrace: boolean;
  jsonFormat: boolean;
}

// Default configuration with environment variable support
const defaultConfig: LoggerConfig = {
  level: LogLevel[process.env.NEXT_PUBLIC_LOG_LEVEL as keyof typeof LogLevel] || LogLevel.INFO,
  enableConsole: process.env.NEXT_PUBLIC_LOG_ENABLE_CONSOLE !== 'false',
  enableStructuredLogging: process.env.NEXT_PUBLIC_LOG_STRUCTURED === 'true',
  includeTimestamp: process.env.NEXT_PUBLIC_LOG_INCLUDE_TIMESTAMP !== 'false',
  includeStackTrace: process.env.NEXT_PUBLIC_LOG_INCLUDE_STACK_TRACE === 'true',
  jsonFormat: process.env.NEXT_PUBLIC_LOG_JSON_FORMAT === 'true',
};

class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  constructor(config: LoggerConfig = defaultConfig) {
    this.config = { ...defaultConfig, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = this.config.includeTimestamp ? entry.timestamp.toISOString() : '';
    const level = LogLevel[entry.level];
    const component = entry.context?.component ? `[${entry.context.component}]` : '';
    const action = entry.context?.action ? `(${entry.context.action})` : '';
    
    if (this.config.jsonFormat) {
      return JSON.stringify({
        timestamp,
        level,
        message: entry.message,
        context: entry.context,
        data: entry.data,
        error: entry.error ? {
          name: entry.error.name,
          message: entry.error.message,
          stack: this.config.includeStackTrace ? entry.error.stack : undefined,
        } : undefined,
      });
    }

    const parts = [
      timestamp,
      `[${level}]`,
      component,
      action,
      entry.message,
    ].filter(Boolean);

    let formatted = parts.join(' ');

    if (entry.data) {
      formatted += '\n' + JSON.stringify(entry.data, null, 2);
    }

    if (entry.error && this.config.includeStackTrace) {
      formatted += '\n' + entry.error.stack;
    }

    return formatted;
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const formatted = this.formatLogEntry(entry);
    
    try {
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(formatted);
          break;
        case LogLevel.INFO:
          console.info(formatted);
          break;
        case LogLevel.WARN:
          console.warn(formatted);
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(formatted);
          break;
        default:
          console.log(formatted);
      }
    } catch (error) {
      // Silently ignore console errors to prevent infinite loops
      // This can happen if console methods are overridden or restricted
    }
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, data?: unknown, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      context: {
        ...context,
        timestamp: new Date(),
      },
      data,
      timestamp: new Date(),
      error,
    };

    this.addToBuffer(entry);
    this.writeToConsole(entry);
  }

  // Public logging methods
  debug(message: string, context?: LogContext, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: LogContext, data?: unknown): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: LogContext, data?: unknown): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  error(message: string, context?: LogContext, data?: unknown, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, data, error);
  }

  fatal(message: string, context?: LogContext, data?: unknown, error?: Error): void {
    this.log(LogLevel.FATAL, message, context, data, error);
  }

  // Utility methods
  getLogBuffer(): LogEntry[] {
    return [...this.logBuffer];
  }

  clearBuffer(): void {
    this.logBuffer = [];
  }

  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // Performance logging helpers
  timeStart(label: string, context?: LogContext): void {
    console.time(label);
    this.debug(`Timer started: ${label}`, context);
  }

  timeEnd(label: string, context?: LogContext): void {
    console.timeEnd(label);
    this.debug(`Timer ended: ${label}`, context);
  }

  // API request logging helpers
  logApiRequest(method: string, url: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${url}`, {
      ...context,
      component: context?.component || 'API',
      action: 'request',
    });
  }

  logApiResponse(method: string, url: string, status: number, duration: number, context?: LogContext): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `API Response: ${method} ${url} ${status} (${duration}ms)`, {
      ...context,
      component: context?.component || 'API',
      action: 'response',
    }, { status, duration });
  }

  // VRM loading logging helpers
  logVrmLoading(filename: string, context?: LogContext): void {
    this.info(`VRM Loading: ${filename}`, {
      ...context,
      component: context?.component || 'VRM',
      action: 'loading',
    });
  }

  logVrmLoaded(filename: string, duration: number, context?: LogContext): void {
    this.info(`VRM Loaded: ${filename} (${duration}ms)`, {
      ...context,
      component: context?.component || 'VRM',
      action: 'loaded',
    }, { duration });
  }

  logVrmError(filename: string, error: Error, context?: LogContext): void {
    this.error(`VRM Error: ${filename}`, {
      ...context,
      component: context?.component || 'VRM',
      action: 'error',
    }, undefined, error);
  }

  // Audio synthesis logging helpers
  logAudioSynthesis(text: string, context?: LogContext): void {
    this.info(`Audio Synthesis: ${text.substring(0, 50)}...`, {
      ...context,
      component: context?.component || 'Audio',
      action: 'synthesis',
    });
  }

  logAudioError(text: string, error: Error, context?: LogContext): void {
    this.error(`Audio Synthesis Error: ${text.substring(0, 50)}...`, {
      ...context,
      component: context?.component || 'Audio',
      action: 'error',
    }, undefined, error);
  }

  // Chat logging helpers
  logChatMessage(message: string, context?: LogContext): void {
    this.info(`Chat Message: ${message.substring(0, 100)}...`, {
      ...context,
      component: context?.component || 'Chat',
      action: 'message',
    });
  }

  logChatResponse(response: string, duration: number, context?: LogContext): void {
    this.info(`Chat Response: ${response.substring(0, 100)}... (${duration}ms)`, {
      ...context,
      component: context?.component || 'Chat',
      action: 'response',
    }, { duration });
  }
}

// Global logger instance
export const logger = new Logger();

// Export factory function for creating scoped loggers
export const createLogger = (componentName: string): Logger => {
  const scopedLogger = new Logger();
  
  // Override log method to automatically add component context
  const originalLog = (scopedLogger as any).log;
  (scopedLogger as any).log = function(level: LogLevel, message: string, context?: LogContext, data?: unknown, error?: Error) {
    return originalLog.call(this, level, message, { component: componentName, ...context }, data, error);
  };
  
  return scopedLogger;
};

// Utility function to create performance wrapper
export const withPerformanceLogging = <T extends (...args: any[]) => any>(
  fn: T,
  name: string,
  context?: LogContext
): T => {
  return ((...args: any[]) => {
    const start = performance.now();
    logger.debug(`Starting ${name}`, context);
    
    try {
      const result = fn(...args);
      
      // Handle promises
      if (result && typeof result.then === 'function') {
        return result
          .then((res: any) => {
            const duration = performance.now() - start;
            logger.debug(`Completed ${name} (${duration.toFixed(2)}ms)`, context);
            return res;
          })
          .catch((error: Error) => {
            const duration = performance.now() - start;
            logger.error(`Failed ${name} (${duration.toFixed(2)}ms)`, context, undefined, error);
            throw error;
          });
      }
      
      // Handle synchronous results
      const duration = performance.now() - start;
      logger.debug(`Completed ${name} (${duration.toFixed(2)}ms)`, context);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logger.error(`Failed ${name} (${duration.toFixed(2)}ms)`, context, undefined, error as Error);
      throw error;
    }
  }) as T;
};