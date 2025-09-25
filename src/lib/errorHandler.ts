/**
 * Centralized error handling system for ChatVRM Platform
 */

import { logger, LogLevel } from './logger';

export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  VRM_LOADING = 'VRM_LOADING',
  AUDIO = 'AUDIO',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export class AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  context?: ErrorContext;
  originalError?: Error;
  timestamp: Date;
  isUserFacing: boolean;
  userMessage?: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    options?: {
      originalError?: Error;
      context?: ErrorContext;
      userMessage?: string;
      isUserFacing?: boolean;
    }
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.originalError = options?.originalError;
    this.context = options?.context;
    this.userMessage = options?.userMessage;
    this.isUserFacing = options?.isUserFacing ?? true;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export interface ErrorHandler {
  handle(error: Error | AppError, context?: ErrorContext): void;
  handleAsync(error: Error | AppError, context?: ErrorContext): Promise<void>;
}

export class ErrorHandlerImpl implements ErrorHandler {
  private errorListeners: ((error: AppError) => void)[] = [];
  private isDevelopment = process.env.NODE_ENV === 'development';

  constructor() {
    // Set up global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleWindowError);
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    }
  }

  private handleWindowError = (event: ErrorEvent) => {
    this.handle(new Error(event.message), {
      component: 'window',
      action: 'error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    this.handle(event.reason, {
      component: 'window',
      action: 'unhandledRejection'
    });
  };

  handle(error: Error | AppError, context?: ErrorContext): void {
    const appError = this.normalizeError(error, context);
    
    // Log error
    this.logError(appError);
    
    // Notify listeners
    this.notifyListeners(appError);
    
    // Send to monitoring service (if configured)
    this.sendToMonitoring(appError);
  }

  async handleAsync(error: Error | AppError, context?: ErrorContext): Promise<void> {
    this.handle(error, context);
  }

  private normalizeError(error: Error | AppError, context?: ErrorContext): AppError {
    if (error instanceof AppError) {
      if (context) {
        error.context = { ...error.context, ...context };
      }
      return error;
    }

    // Convert regular errors to AppError
    const type = this.inferErrorType(error);
    const severity = this.inferErrorSeverity(error, type);
    const userMessage = this.generateUserMessage(error, type);

    return new AppError(error.message, type, severity, {
      originalError: error,
      context,
      userMessage,
      isUserFacing: true
    });
  }

  private inferErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('api') || message.includes('openai') || message.includes('koeiromap')) {
      return ErrorType.API;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    if (message.includes('vrm') || message.includes('model')) {
      return ErrorType.VRM_LOADING;
    }
    if (message.includes('audio') || message.includes('voice')) {
      return ErrorType.AUDIO;
    }
    if (message.includes('permission') || message.includes('denied')) {
      return ErrorType.PERMISSION;
    }
    
    return ErrorType.UNKNOWN;
  }

  private inferErrorSeverity(error: Error, type: ErrorType): ErrorSeverity {
    // Network errors are usually recoverable
    if (type === ErrorType.NETWORK) {
      return ErrorSeverity.MEDIUM;
    }
    
    // API errors might be rate limits or temporary
    if (type === ErrorType.API) {
      return ErrorSeverity.MEDIUM;
    }
    
    // Permission errors are critical for functionality
    if (type === ErrorType.PERMISSION) {
      return ErrorSeverity.HIGH;
    }
    
    // Validation errors are usually low severity
    if (type === ErrorType.VALIDATION) {
      return ErrorSeverity.LOW;
    }
    
    return ErrorSeverity.MEDIUM;
  }

  private generateUserMessage(error: Error, type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'ネットワーク接続に問題が発生しました。接続を確認してください。';
      case ErrorType.API:
        return 'サービスへの接続に問題が発生しました。しばらく待ってから再度お試しください。';
      case ErrorType.VALIDATION:
        return '入力内容に問題があります。確認してください。';
      case ErrorType.VRM_LOADING:
        return 'VRMモデルの読み込みに失敗しました。ファイルを確認してください。';
      case ErrorType.AUDIO:
        return '音声の処理に問題が発生しました。';
      case ErrorType.PERMISSION:
        return '必要な権限がありません。ブラウザの設定を確認してください。';
      default:
        return 'エラーが発生しました。再度お試しください。';
    }
  }

  private logError(error: AppError): void {
    const logLevel = this.mapSeverityToLogLevel(error.severity);
    const logData = {
      type: error.type,
      severity: error.severity,
      timestamp: error.timestamp,
      stack: error.stack,
      userMessage: error.userMessage,
      isUserFacing: error.isUserFacing
    };

    // Use structured logging with appropriate context
    const logContext = {
      component: error.context?.component || 'ErrorHandler',
      action: error.context?.action || 'handle',
      userId: error.context?.userId,
      metadata: error.context?.metadata
    };

    switch (logLevel) {
      case LogLevel.WARN:
        logger.warn(`${error.type} Error: ${error.message}`, logContext, logData);
        break;
      case LogLevel.ERROR:
        logger.error(`${error.type} Error: ${error.message}`, logContext, logData, error.originalError || error);
        break;
      case LogLevel.FATAL:
        logger.fatal(`${error.type} Error: ${error.message}`, logContext, logData, error.originalError || error);
        break;
      default:
        logger.error(`${error.type} Error: ${error.message}`, logContext, logData, error.originalError || error);
    }
  }

  private mapSeverityToLogLevel(severity: ErrorSeverity): LogLevel {
    switch (severity) {
      case ErrorSeverity.LOW:
        return LogLevel.WARN;
      case ErrorSeverity.MEDIUM:
        return LogLevel.ERROR;
      case ErrorSeverity.HIGH:
        return LogLevel.ERROR;
      case ErrorSeverity.CRITICAL:
        return LogLevel.FATAL;
      default:
        return LogLevel.ERROR;
    }
  }

  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
  }

  private sendToMonitoring(error: AppError): void {
    // TODO: Integrate with error monitoring service (e.g., Sentry)
    // This is a placeholder for future implementation
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Send to Sentry
    }
  }

  addErrorListener(listener: (error: AppError) => void): () => void {
    this.errorListeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  cleanup(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', this.handleWindowError);
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    }
    this.errorListeners = [];
  }
}

// Singleton instance
export const errorHandler = new ErrorHandlerImpl();

// Utility functions for common error scenarios
export const handleNetworkError = (error: Error, context?: ErrorContext): AppError => {
  const appError = new AppError(
    error.message,
    ErrorType.NETWORK,
    ErrorSeverity.MEDIUM,
    {
      originalError: error,
      context,
      userMessage: 'ネットワーク接続に問題が発生しました。接続を確認してください。'
    }
  );
  errorHandler.handle(appError);
  return appError;
};

export const handleApiError = (
  error: Error,
  apiName: string,
  context?: ErrorContext
): AppError => {
  const appError = new AppError(
    `API Error: ${apiName} - ${error.message}`,
    ErrorType.API,
    ErrorSeverity.MEDIUM,
    {
      originalError: error,
      context: { ...context, action: `${apiName}_api_call` },
      userMessage: `${apiName}との通信でエラーが発生しました。`
    }
  );
  errorHandler.handle(appError);
  return appError;
};

export const handleValidationError = (
  message: string,
  field?: string,
  context?: ErrorContext
): AppError => {
  const appError = new AppError(
    message,
    ErrorType.VALIDATION,
    ErrorSeverity.LOW,
    {
      context: { ...context, metadata: { field } },
      userMessage: message
    }
  );
  errorHandler.handle(appError);
  return appError;
};

// React hook for error handling
export const useErrorHandler = () => {
  const handleError = (error: Error | AppError, context?: ErrorContext) => {
    errorHandler.handle(error, context);
  };

  return { handleError };
};