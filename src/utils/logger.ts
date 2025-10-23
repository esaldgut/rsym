/**
 * Logger seguro que solo funciona en desarrollo
 * Evita exponer información sensible en producción
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogData {
  [key: string]: unknown;
}

class SecureLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private log(level: LogLevel, message: string, data?: LogData) {
    if (!this.isDevelopment) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (data) {
      console[level](`${prefix} ${message}`, this.sanitizeData(data));
    } else {
      console[level](`${prefix} ${message}`);
    }
  }
  
  private sanitizeData(data: LogData): LogData {
    const sanitized = { ...data };
    
    // Remover información sensible
    const sensitiveKeys = [
      'password', 'token', 'accessToken', 'idToken', 'refreshToken',
      'authorization', 'auth', 'secret', 'key', 'sub', 'email'
    ];
    
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
  
  info(message: string, data?: LogData) {
    this.log('info', message, data);
  }
  
  warn(message: string, data?: LogData) {
    this.log('warn', message, data);
  }
  
  error(message: string, data?: LogData) {
    this.log('error', message, data);
  }
  
  debug(message: string, data?: LogData) {
    this.log('debug', message, data);
  }
  
  auth(message: string, operation?: string) {
    if (!this.isDevelopment) return;
    const prefix = operation ? `[AUTH:${operation}]` : '[AUTH]';
    console.info(`${prefix} ${message}`);
  }
  
  graphql(operation: string, success: boolean) {
    if (!this.isDevelopment) return;
    const status = success ? '✅' : '❌';
    console.info(`[GraphQL] ${status} ${operation}`);
  }

  deepLink(message: string, data?: LogData) {
    if (!this.isDevelopment) return;
    console.info(`🔗 [DeepLink] ${message}`, data ? this.sanitizeData(data) : '');
  }

  performance(operation: string, duration: number) {
    if (!this.isDevelopment) return;
    const emoji = duration > 1000 ? '🐌' : '⚡';
    console.info(`${emoji} [Performance] ${operation}: ${duration.toFixed(2)}ms`);
  }
}

export const logger = new SecureLogger();

// Helper para medir performance
export function measurePerformance<T>(
  operation: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now();

  const result = fn();

  if (result instanceof Promise) {
    return result.finally(() => {
      const duration = performance.now() - start;
      logger.performance(operation, duration);
    });
  }

  const duration = performance.now() - start;
  logger.performance(operation, duration);
  return result;
}