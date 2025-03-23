import winston from 'winston';
import { config } from '../config';

// Define a custom info interface with metadata
interface LogInfo extends winston.Logform.TransformableInfo {
  metadata?: Record<string, unknown>;
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Create format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info: LogInfo) => `${info.timestamp} ${info.level}: ${info.message} ${info.metadata ? JSON.stringify(info.metadata) : ''}`
  )
);

// Create format for file output (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.json()
);

// Create a custom format that includes metadata
const formatWithMetadata = winston.format((info: LogInfo) => {
  // Create a properly typed metadata object if it doesn't exist
  if (!info.metadata) {
    info.metadata = {};
  }
  
  // Extract known non-metadata fields
  const standardFields = ['level', 'message', 'timestamp', 'service'];
  
  // Add all other fields to metadata
  Object.keys(info).forEach(key => {
    if (!standardFields.includes(key) && key !== 'metadata') {
      if (info.metadata) {
        info.metadata[key] = info[key as keyof typeof info];
        delete info[key as keyof typeof info];
      }
    }
  });
  
  return info;
});

// Create the logger
export const logger = winston.createLogger({
  level: config.server.logLevel || 'info',
  levels,
  format: winston.format.combine(
    formatWithMetadata(),
    winston.format.errors({ stack: true }),
    winston.format.metadata()
  ),
  defaultMeta: { service: 'gambit-chess-server' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat
    }),
    
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat
    })
  ]
});

// If we're in development, also log to the console with simple formatting
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}

// Export a stream object for Morgan integration
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  }
}; 