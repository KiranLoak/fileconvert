/**
 * Winston Logger
 * Structured logging for both dev (colorized) and prod (JSON) environments
 */

const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors } = format;

// Human-readable format for development
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => {
    return stack
      ? `${timestamp} [${level}]: ${message}\n${stack}`
      : `${timestamp} [${level}]: ${message}`;
  })
);

// JSON format for production (structured logs for log aggregators)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  format.json()
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    new transports.Console(),
    // File transport for persistent logs
    new transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3,
    }),
    new transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
  // Don't crash on unhandled exceptions — log them
  exceptionHandlers: [
    new transports.File({
      filename: path.join(__dirname, '../logs/exceptions.log'),
    }),
  ],
});

// Ensure logs directory exists
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

module.exports = logger;
