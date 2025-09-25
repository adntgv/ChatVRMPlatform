// Use the real errorHandler, not a mock
import {
  AppError,
  ErrorType,
  ErrorSeverity,
  ErrorHandlerImpl,
  handleNetworkError,
  handleApiError,
  handleValidationError
} from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

// Mock the logger to avoid console output in tests
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
  LogLevel: {
    WARN: 2,
    ERROR: 3,
    FATAL: 4,
  },
}));

describe('ErrorHandler', () => {
  let errorHandler: any;
  let mockLogger: any;
  
  beforeEach(() => {
    // Clear mock calls before each test
    jest.clearAllMocks();
    
    // Get the mocked logger
    mockLogger = logger as any;
    
    // Create a new instance for each test
    errorHandler = new (ErrorHandlerImpl as any)();
  });

  afterEach(() => {
    jest.clearAllMocks();
    errorHandler.cleanup();
  });

  describe('AppError', () => {
    it('should create an error with default values', () => {
      const error = new AppError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.type).toBe(ErrorType.UNKNOWN);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.isUserFacing).toBe(true);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should create an error with custom values', () => {
      const originalError = new Error('Original');
      const context = { component: 'TestComponent', action: 'testAction' };
      
      const error = new AppError('Custom error', ErrorType.API, ErrorSeverity.HIGH, {
        originalError,
        context,
        userMessage: 'User friendly message',
        isUserFacing: false
      });
      
      expect(error.message).toBe('Custom error');
      expect(error.type).toBe(ErrorType.API);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.originalError).toBe(originalError);
      expect(error.context).toEqual(context);
      expect(error.userMessage).toBe('User friendly message');
      expect(error.isUserFacing).toBe(false);
    });
  });

  describe('Error Type Inference', () => {
    it('should infer network error type', () => {
      const error = new Error('Network request failed');
      errorHandler.handle(error);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('NETWORK Error'),
        expect.any(Object),
        expect.any(Object),
        expect.any(Error)
      );
    });

    it('should infer API error type', () => {
      const error = new Error('OpenAI API error');
      errorHandler.handle(error);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('API Error'),
        expect.any(Object),
        expect.any(Object),
        expect.any(Error)
      );
    });

    it('should infer validation error type', () => {
      const error = new Error('Invalid input provided');
      errorHandler.handle(error);
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('VALIDATION Error'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should infer VRM loading error type', () => {
      const error = new Error('Failed to load VRM model');
      errorHandler.handle(error);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('VRM_LOADING Error'),
        expect.any(Object),
        expect.any(Object),
        expect.any(Error)
      );
    });

    it('should infer audio error type', () => {
      const error = new Error('Audio synthesis failed');
      errorHandler.handle(error);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('AUDIO Error'),
        expect.any(Object),
        expect.any(Object),
        expect.any(Error)
      );
    });

    it('should infer permission error type', () => {
      const error = new Error('Microphone permission denied');
      errorHandler.handle(error);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('PERMISSION Error'),
        expect.any(Object),
        expect.any(Object),
        expect.any(Error)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle regular errors', () => {
      const error = new Error('Test error');
      const context = { component: 'TestComponent' };
      
      errorHandler.handle(error, context);
      
      expect(consoleGroupSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Message:',
        'Test error'
      );
    });

    it('should handle AppError instances', () => {
      const error = new AppError('App error', ErrorType.API, ErrorSeverity.HIGH);
      
      errorHandler.handle(error);
      
      expect(consoleGroupSpy).toHaveBeenCalledWith(
        expect.stringContaining('HIGH')
      );
    });

    it('should merge context when handling AppError with additional context', () => {
      const error = new AppError('App error', ErrorType.API, ErrorSeverity.HIGH, {
        context: { component: 'Original' }
      });
      
      errorHandler.handle(error, { action: 'newAction' });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Context:',
        expect.objectContaining({
          component: 'Original',
          action: 'newAction'
        })
      );
    });
  });

  describe('Error Listeners', () => {
    it('should notify error listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      const unsubscribe1 = errorHandler.addErrorListener(listener1);
      errorHandler.addErrorListener(listener2);
      
      const error = new Error('Test error');
      errorHandler.handle(error);
      
      expect(listener1).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error'
        })
      );
      expect(listener2).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error'
        })
      );
      
      // Test unsubscribe
      unsubscribe1();
      errorHandler.handle(error);
      
      expect(listener1).toHaveBeenCalledTimes(1); // Not called again
      expect(listener2).toHaveBeenCalledTimes(2); // Called again
    });

    it('should handle errors in listeners gracefully', () => {
      const badListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();
      
      errorHandler.addErrorListener(badListener);
      errorHandler.addErrorListener(goodListener);
      
      const error = new Error('Test error');
      errorHandler.handle(error);
      
      expect(badListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in error listener:',
        expect.any(Error)
      );
    });
  });

  describe('Utility Functions', () => {
    it('should handle network errors', () => {
      const error = new Error('Connection failed');
      const appError = handleNetworkError(error, { component: 'Test' });
      
      expect(appError.type).toBe(ErrorType.NETWORK);
      expect(appError.userMessage).toBe('ネットワーク接続に問題が発生しました。接続を確認してください。');
      // The utility functions use the singleton instance, not our test instance
      // So we can't check console calls here
    });

    it('should handle API errors', () => {
      const error = new Error('Rate limit exceeded');
      const appError = handleApiError(error, 'OpenAI', { component: 'Chat' });
      
      expect(appError.type).toBe(ErrorType.API);
      expect(appError.message).toContain('OpenAI');
      expect(appError.userMessage).toBe('OpenAIとの通信でエラーが発生しました。');
    });

    it('should handle validation errors', () => {
      const appError = handleValidationError(
        'Invalid email format',
        'email',
        { component: 'Form' }
      );
      
      expect(appError.type).toBe(ErrorType.VALIDATION);
      expect(appError.severity).toBe(ErrorSeverity.LOW);
      expect(appError.userMessage).toBe('Invalid email format');
      expect(appError.context?.metadata?.field).toBe('email');
    });
  });

  describe('Production vs Development', () => {
    it('should log simplified in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Create a new instance with production env
      const prodErrorHandler = new (ErrorHandlerImpl as any)();
      
      const error = new Error('Test error');
      prodErrorHandler.handle(error);
      
      expect(consoleGroupSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error:',
        expect.objectContaining({
          message: 'Test error'
        })
      );

      prodErrorHandler.cleanup();
      process.env.NODE_ENV = originalEnv;
    });
  });
});