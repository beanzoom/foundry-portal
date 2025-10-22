/**
 * Centralized Logging Service
 * Provides environment-aware logging with namespace support
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export interface LoggerConfig {
  level?: LogLevel;
  enableTimestamp?: boolean;
  enableColors?: boolean;
  remoteLogging?: boolean;
}

/**
 * Get default log level based on environment
 */
function getDefaultLogLevel(): LogLevel {
  // Check for explicit log level in environment
  const envLevel = import.meta.env.VITE_LOG_LEVEL;
  if (envLevel) {
    return LogLevel[envLevel as keyof typeof LogLevel] || LogLevel.INFO;
  }

  // Default based on environment
  if (import.meta.env.PROD) {
    return LogLevel.ERROR; // Only errors in production
  }
  if (import.meta.env.DEV) {
    return LogLevel.DEBUG; // Everything in development
  }
  return LogLevel.INFO; // Default for other environments
}

/**
 * Logger class with namespace support
 */
class Logger {
  private namespace: string;
  private level: LogLevel;
  private enableTimestamp: boolean;
  private enableColors: boolean;
  private remoteLogging: boolean;

  constructor(namespace: string, config: LoggerConfig = {}) {
    this.namespace = namespace;
    this.level = config.level ?? getDefaultLogLevel();
    this.enableTimestamp = config.enableTimestamp ?? import.meta.env.DEV;
    this.enableColors = config.enableColors ?? true;
    this.remoteLogging = config.remoteLogging ?? false;
  }

  /**
   * Format the log prefix
   */
  private getPrefix(level: string): string {
    const parts: string[] = [];

    if (this.enableTimestamp) {
      parts.push(new Date().toISOString().slice(11, 23)); // HH:mm:ss.SSS
    }

    parts.push(`[${this.namespace}]`);

    if (level) {
      parts.push(`[${level}]`);
    }

    return parts.join(' ');
  }

  /**
   * Get console style based on log level
   */
  private getStyle(level: LogLevel): string {
    if (!this.enableColors) return '';

    const styles: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: 'color: #8B8B8B',
      [LogLevel.INFO]: 'color: #2563EB',
      [LogLevel.WARN]: 'color: #D97706',
      [LogLevel.ERROR]: 'color: #DC2626',
      [LogLevel.NONE]: ''
    };

    return styles[level] || '';
  }

  /**
   * Send log to remote service (if configured)
   */
  private async sendToRemote(level: LogLevel, message: string, data?: any) {
    if (!this.remoteLogging || import.meta.env.DEV) return;

    try {
      // This could be replaced with your actual remote logging service
      // Example: Sentry, LogRocket, custom API, etc.
      const payload = {
        timestamp: new Date().toISOString(),
        namespace: this.namespace,
        level: LogLevel[level],
        message,
        data,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Placeholder for remote logging endpoint
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // });
    } catch (error) {
      // Silently fail remote logging to avoid infinite loops
    }
  }

  /**
   * Debug level logging
   */
  debug(message: string, ...args: any[]) {
    if (this.level > LogLevel.DEBUG) return;

    const prefix = this.getPrefix('DEBUG');
    const style = this.getStyle(LogLevel.DEBUG);

    if (style && args.length === 0) {
      console.log(`%c${prefix} ${message}`, style);
    } else {
      console.log(prefix, message, ...args);
    }
  }

  /**
   * Info level logging
   */
  info(message: string, ...args: any[]) {
    if (this.level > LogLevel.INFO) return;

    const prefix = this.getPrefix('INFO');
    const style = this.getStyle(LogLevel.INFO);

    if (style && args.length === 0) {
      console.info(`%c${prefix} ${message}`, style);
    } else {
      console.info(prefix, message, ...args);
    }
  }

  /**
   * Warning level logging
   */
  warn(message: string, ...args: any[]) {
    if (this.level > LogLevel.WARN) return;

    const prefix = this.getPrefix('WARN');
    const style = this.getStyle(LogLevel.WARN);

    if (style && args.length === 0) {
      console.warn(`%c${prefix} ${message}`, style);
    } else {
      console.warn(prefix, message, ...args);
    }

    this.sendToRemote(LogLevel.WARN, message, args);
  }

  /**
   * Error level logging
   */
  error(message: string, ...args: any[]) {
    if (this.level > LogLevel.ERROR) return;

    const prefix = this.getPrefix('ERROR');
    const style = this.getStyle(LogLevel.ERROR);

    if (style && args.length === 0) {
      console.error(`%c${prefix} ${message}`, style);
    } else {
      console.error(prefix, message, ...args);
    }

    this.sendToRemote(LogLevel.ERROR, message, args);
  }

  /**
   * Group related logs together
   */
  group(label: string, collapsed = false) {
    if (this.level > LogLevel.DEBUG) return;

    const prefix = this.getPrefix('GROUP');
    if (collapsed) {
      console.groupCollapsed(prefix, label);
    } else {
      console.group(prefix, label);
    }
  }

  /**
   * End a log group
   */
  groupEnd() {
    if (this.level > LogLevel.DEBUG) return;
    console.groupEnd();
  }

  /**
   * Measure performance
   */
  time(label: string) {
    if (this.level > LogLevel.DEBUG) return;
    console.time(`[${this.namespace}] ${label}`);
  }

  /**
   * End performance measurement
   */
  timeEnd(label: string) {
    if (this.level > LogLevel.DEBUG) return;
    console.timeEnd(`[${this.namespace}] ${label}`);
  }

  /**
   * Create a table for structured data
   */
  table(data: any) {
    if (this.level > LogLevel.DEBUG) return;
    console.table(data);
  }

  /**
   * Set the log level dynamically
   */
  setLevel(level: LogLevel) {
    this.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }
}

/**
 * Logger cache to avoid creating multiple instances
 */
const loggerCache = new Map<string, Logger>();

/**
 * Create or get a logger instance
 */
export function createLogger(namespace: string, config?: LoggerConfig): Logger {
  const cacheKey = namespace;

  if (!loggerCache.has(cacheKey)) {
    loggerCache.set(cacheKey, new Logger(namespace, config));
  }

  return loggerCache.get(cacheKey)!;
}

/**
 * Global logger for general use
 */
export const logger = createLogger('App');

/**
 * Utility to set global log level (useful for debugging)
 */
export function setGlobalLogLevel(level: LogLevel) {
  loggerCache.forEach(logger => logger.setLevel(level));

  // Store in session for persistence
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('LOG_LEVEL', LogLevel[level]);
  }
}

/**
 * Initialize global log level from session storage
 */
if (typeof window !== 'undefined') {
  const storedLevel = sessionStorage.getItem('LOG_LEVEL');
  if (storedLevel && storedLevel in LogLevel) {
    setGlobalLogLevel(LogLevel[storedLevel as keyof typeof LogLevel]);
  }
}

/**
 * Legacy configuration function for backward compatibility
 */
export interface LegacyLoggerConfig {
  enabled?: boolean;
  level?: 'debug' | 'info' | 'warn' | 'error';
  groupCollapsed?: boolean;
}

export function configureLogger(config: LegacyLoggerConfig) {
  // Map legacy config to new system
  if (!config.enabled) {
    setGlobalLogLevel(LogLevel.NONE);
    return;
  }

  const levelMap: Record<string, LogLevel> = {
    'debug': LogLevel.DEBUG,
    'info': LogLevel.INFO,
    'warn': LogLevel.WARN,
    'error': LogLevel.ERROR
  };

  if (config.level) {
    setGlobalLogLevel(levelMap[config.level] || LogLevel.INFO);
  }

  // Note: groupCollapsed is handled at the logger level now
}

/**
 * Export for window access in development
 */
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).logging = {
    setLevel: setGlobalLogLevel,
    LogLevel,
    loggers: loggerCache
  };
}