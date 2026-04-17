const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'ccb-backend' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error' 
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log') 
    })
  ]
});

// Development: colorized console. Production (e.g. Render): plain stdout so log tail shows DB errors and startup.
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ level, message, timestamp, stack }) =>
          stack ? `${timestamp} [${level}]: ${message}\n${stack}` : `${timestamp} [${level}]: ${message}`
        )
      )
    })
  );
} else {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple())
    })
  );
}

module.exports = logger;
