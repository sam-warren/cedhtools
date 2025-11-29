/**
 * Enterprise Logging Utility
 * 
 * Provides structured logging with log levels, context, and environment-aware output.
 * 
 * ## Features
 * - Log levels: debug, info, warn, error
 * - Structured JSON output for production (machine-readable)
 * - Pretty output for development (human-readable)
 * - Context/metadata support for tracing
 * - Performance timing utilities
 * - Child loggers for component isolation
 * 
 * ## Usage
 * ```typescript
 * import { logger } from '@/lib/logger';
 * 
 * // Basic logging
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Database error', { error: err.message });
 * 
 * // Child logger with context
 * const etlLogger = logger.child({ module: 'etl' });
 * etlLogger.info('Processing started');
 * 
 * // Performance timing
 * const timer = logger.startTimer('database-query');
 * // ... do work ...
 * timer.done({ rowsAffected: 100 });
 * ```
 */

// =============================================================================
// TYPES
// =============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
}

export interface LoggerConfig {
  /** Minimum log level to output */
  level: LogLevel;
  /** Whether to output structured JSON (true) or pretty format (false) */
  structured: boolean;
  /** Base context added to all log entries */
  baseContext?: LogContext;
}

export interface Timer {
  /** Complete the timing and log the duration */
  done: (context?: LogContext) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
};

const RESET_COLOR = '\x1b[0m';

// =============================================================================
// LOGGER CLASS
// =============================================================================

class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    this.config = {
      level: (process.env.LOG_LEVEL as LogLevel) || (isProduction ? 'info' : 'debug'),
      structured: isProduction,
      baseContext: config?.baseContext,
      ...config,
    };
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    return new Logger({
      ...this.config,
      baseContext: {
        ...this.config.baseContext,
        ...context,
      },
    });
  }

  /**
   * Start a performance timer
   */
  startTimer(operation: string): Timer {
    const startTime = Date.now();
    return {
      done: (context?: LogContext) => {
        const duration = Date.now() - startTime;
        this.info(`${operation} completed`, {
          ...context,
          operation,
          durationMs: duration,
          performance: true,
        });
      },
    };
  }

  /**
   * Log at debug level (verbose, development only)
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log at info level (normal operations)
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log at warn level (potential issues)
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log at error level (failures)
   */
  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  /**
   * Log an error object with stack trace
   */
  logError(message: string, error: unknown, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : String(error),
    };
    this.error(message, errorContext);
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    // Check if this level should be logged
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.level]) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: {
        ...this.config.baseContext,
        ...context,
      },
    };

    // Remove empty context
    if (entry.context && Object.keys(entry.context).length === 0) {
      delete entry.context;
    }

    this.output(entry);
  }

  private output(entry: LogEntry): void {
    if (this.config.structured) {
      // Production: JSON output for log aggregation systems
      console.log(JSON.stringify(entry));
    } else {
      // Development: Pretty, colorized output
      const color = LOG_COLORS[entry.level];
      const levelPadded = entry.level.toUpperCase().padEnd(5);
      const timestamp = entry.timestamp.split('T')[1].slice(0, 12);
      
      let output = `${color}[${levelPadded}]${RESET_COLOR} ${timestamp} ${entry.message}`;
      
      if (entry.context) {
        const contextStr = JSON.stringify(entry.context, null, 2);
        // Only add context on separate line if it's complex
        if (contextStr.includes('\n')) {
          output += `\n${color}  └─${RESET_COLOR} ${contextStr}`;
        } else {
          output += ` ${color}${contextStr}${RESET_COLOR}`;
        }
      }
      
      if (entry.level === 'error') {
        console.error(output);
      } else if (entry.level === 'warn') {
        console.warn(output);
      } else {
        console.log(output);
      }
    }
  }
}

// =============================================================================
// MODULE LOGGERS
// =============================================================================

/** Root logger instance */
export const logger = new Logger();

/** ETL-specific logger with module context */
export const etlLogger = logger.child({ module: 'etl' });

/** API-specific logger with module context */
export const apiLogger = logger.child({ module: 'api' });

/** Worker-specific logger with module context */
export const workerLogger = logger.child({ module: 'worker' });

/** CLI-specific logger - always uses pretty output for terminal scripts */
export const cliLogger = new Logger({ 
  structured: false, 
  level: 'info',
  baseContext: { module: 'cli' }
});

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export { Logger };
export default logger;

