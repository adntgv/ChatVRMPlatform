/**
 * @jest-environment jsdom
 */

import { logger, Logger, LogLevel, LogContext, createLogger, withPerformanceLogging } from '../../lib/logger';

// Mock console methods
const originalConsole = { ...console };
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
  time: jest.fn(),
  timeEnd: jest.fn(),
};

describe('Logger', () => {
  beforeEach(() => {
    // Replace console methods with mocks
    Object.assign(console, mockConsole);
    
    // Clear mock calls
    Object.values(mockConsole).forEach(mock => mock.mockClear());
    
    // Clear logger buffer and reset config
    logger.clearBuffer();
    logger.updateConfig({ 
      level: LogLevel.DEBUG, 
      enableConsole: true, 
      jsonFormat: false 
    });
  });

  afterEach(() => {
    // Restore original console
    Object.assign(console, originalConsole);
  });

  describe('Basic logging functionality', () => {
    it('should log debug messages', () => {
      logger.debug('Test debug message', { component: 'TestComponent' });
      
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]')
      );
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('Test debug message')
      );
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('[TestComponent]')
      );
    });

    it('should log info messages', () => {
      logger.info('Test info message', { component: 'TestComponent' });
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Test info message')
      );
    });

    it('should log warn messages', () => {
      logger.warn('Test warn message', { component: 'TestComponent' });
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]')
      );
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Test warn message')
      );
    });

    it('should log error messages', () => {
      const testError = new Error('Test error');
      logger.error('Test error message', { component: 'TestComponent' }, undefined, testError);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]')
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error message')
      );
    });

    it('should log fatal messages', () => {
      const testError = new Error('Test fatal error');
      logger.fatal('Test fatal message', { component: 'TestComponent' }, undefined, testError);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[FATAL]')
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Test fatal message')
      );
    });
  });

  describe('Log levels', () => {
    it('should respect log level filtering', () => {
      // Set log level to ERROR
      logger.updateConfig({ level: LogLevel.ERROR });
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should allow all logs when level is DEBUG', () => {
      logger.updateConfig({ level: LogLevel.DEBUG });
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');
      
      expect(mockConsole.debug).toHaveBeenCalled();
      expect(mockConsole.info).toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });

  describe('Context and metadata', () => {
    it('should include context in log messages', () => {
      const context: LogContext = {
        component: 'TestComponent',
        action: 'testAction',
        userId: 'user123'
      };
      
      logger.info('Test message', context);
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[TestComponent]')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('(testAction)')
      );
    });

    it('should include additional data in log messages', () => {
      const data = { key: 'value', number: 42 };
      logger.info('Test message', { component: 'TestComponent' }, data);
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Test message')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(data, null, 2))
      );
    });
  });

  describe('Log buffer', () => {
    it('should maintain log buffer', () => {
      logger.clearBuffer();
      
      logger.info('Message 1');
      logger.warn('Message 2');
      logger.error('Message 3');
      
      const buffer = logger.getLogBuffer();
      expect(buffer).toHaveLength(3);
      expect(buffer[0].message).toBe('Message 1');
      expect(buffer[1].message).toBe('Message 2');
      expect(buffer[2].message).toBe('Message 3');
    });

    it('should limit buffer size', () => {
      logger.clearBuffer();
      
      // Create more than 100 log entries
      for (let i = 0; i < 105; i++) {
        logger.info(`Message ${i}`);
      }
      
      const buffer = logger.getLogBuffer();
      expect(buffer).toHaveLength(100);
      expect(buffer[0].message).toBe('Message 5'); // First 5 should be dropped
    });
  });

  describe('Configuration', () => {
    it('should allow configuration updates', () => {
      const newConfig = {
        level: LogLevel.ERROR,
        enableConsole: false,
        jsonFormat: true
      };
      
      logger.updateConfig(newConfig);
      const config = logger.getConfig();
      
      expect(config.level).toBe(LogLevel.ERROR);
      expect(config.enableConsole).toBe(false);
      expect(config.jsonFormat).toBe(true);
    });

    it('should not log when console is disabled', () => {
      logger.updateConfig({ enableConsole: false });
      
      logger.info('Test message');
      
      expect(mockConsole.info).not.toHaveBeenCalled();
    });
  });

  describe('JSON format', () => {
    it('should format logs as JSON when enabled', () => {
      logger.updateConfig({ jsonFormat: true });
      
      logger.info('Test message', { component: 'TestComponent' }, { key: 'value' });
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/^\{.*\}$/)
      );
    });
  });

  describe('Helper methods', () => {
    it('should provide API request logging', () => {
      logger.logApiRequest('GET', '/api/test', { component: 'ApiClient' });
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('API Request: GET /api/test')
      );
    });

    it('should provide API response logging', () => {
      logger.logApiResponse('GET', '/api/test', 200, 150, { component: 'ApiClient' });
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('API Response: GET /api/test 200 (150ms)')
      );
    });

    it('should provide VRM loading logging', () => {
      logger.logVrmLoading('test.vrm', { component: 'VrmLoader' });
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('VRM Loading: test.vrm')
      );
    });

    it('should provide VRM error logging', () => {
      const error = new Error('VRM load failed');
      logger.logVrmError('test.vrm', error, { component: 'VrmLoader' });
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('VRM Error: test.vrm')
      );
    });

    it('should provide audio synthesis logging', () => {
      logger.logAudioSynthesis('Hello world', { component: 'AudioSynth' });
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Audio Synthesis: Hello world')
      );
    });

    it('should provide chat message logging', () => {
      logger.logChatMessage('User message', { component: 'Chat' });
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Chat Message: User message')
      );
    });

    it('should provide performance timing', () => {
      logger.timeStart('test-operation');
      expect(mockConsole.time).toHaveBeenCalledWith('test-operation');
      
      logger.timeEnd('test-operation');
      expect(mockConsole.timeEnd).toHaveBeenCalledWith('test-operation');
    });
  });

  describe('Scoped logger', () => {
    it('should create scoped logger with automatic component context', () => {
      const scopedLogger = createLogger('ScopedComponent');
      
      scopedLogger.info('Test message');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[ScopedComponent]')
      );
    });
  });

  describe('Performance wrapper', () => {
    it('should wrap synchronous functions with performance logging', () => {
      const testFunction = jest.fn(() => 'result');
      const wrappedFunction = withPerformanceLogging(testFunction, 'testFunction');
      
      const result = wrappedFunction('arg1', 'arg2');
      
      expect(testFunction).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toBe('result');
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('Starting testFunction')
      );
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('Completed testFunction')
      );
    });

    it('should wrap asynchronous functions with performance logging', async () => {
      const testFunction = jest.fn().mockResolvedValue('async result');
      const wrappedFunction = withPerformanceLogging(testFunction, 'asyncFunction');
      
      const result = await wrappedFunction('arg1');
      
      expect(testFunction).toHaveBeenCalledWith('arg1');
      expect(result).toBe('async result');
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('Starting asyncFunction')
      );
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('Completed asyncFunction')
      );
    });

    it('should handle errors in wrapped functions', () => {
      const testError = new Error('Test error');
      const testFunction = jest.fn().mockImplementation(() => {
        throw testError;
      });
      const wrappedFunction = withPerformanceLogging(testFunction, 'errorFunction');
      
      expect(() => wrappedFunction()).toThrow(testError);
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed errorFunction')
      );
    });

    it('should handle rejected promises in wrapped functions', async () => {
      const testError = new Error('Async error');
      const testFunction = jest.fn().mockRejectedValue(testError);
      const wrappedFunction = withPerformanceLogging(testFunction, 'rejectedFunction');
      
      await expect(wrappedFunction()).rejects.toThrow(testError);
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed rejectedFunction')
      );
    });
  });

  describe('Error handling', () => {
    it('should handle logging errors gracefully', () => {
      // Mock console.error to throw an error
      const originalError = console.error;
      console.error = jest.fn().mockImplementation(() => {
        throw new Error('Console error');
      });
      
      // This should not throw
      expect(() => {
        logger.error('Test error');
      }).not.toThrow();
      
      // Restore console.error
      console.error = originalError;
    });
  });
});