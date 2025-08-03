const winston = require('winston');
const path = require('path');
require('dotenv').config();

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false
});

// Create a stream object for Morgan
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Helper functions for different log types
const logError = (error, context = '') => {
  const message = context ? `${context}: ${error.message}` : error.message;
  logger.error(message, {
    stack: error.stack,
    ...error
  });
};

const logInfo = (message, data = {}) => {
  logger.info(message, data);
};

const logWarn = (message, data = {}) => {
  logger.warn(message, data);
};

const logDebug = (message, data = {}) => {
  logger.debug(message, data);
};

const logHttp = (message, data = {}) => {
  logger.http(message, data);
};

// Request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    
    if (res.statusCode >= 400) {
      logError(new Error(logMessage), 'HTTP Request');
    } else {
      logHttp(logMessage);
    }
  });
  
  next();
};

// Error logger middleware
const errorLogger = (error, req, res, next) => {
  logError(error, `Request: ${req.method} ${req.originalUrl}`);
  next(error);
};

module.exports = {
  logger,
  logError,
  logInfo,
  logWarn,
  logDebug,
  logHttp,
  requestLogger,
  errorLogger
}; 