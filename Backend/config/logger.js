const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
      if (stack) log += `\n${stack}`;
      if (Object.keys(meta).length > 0) {
        log += `\n${JSON.stringify(meta, null, 2)}`;
      }
      return log;
    })
  ),
  transports: [
  
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }),
    
 
    new winston.transports.File({ 
      filename: path.join(logsDir, 'app.log'),
      maxsize: 10485760,
      maxFiles: 5
    }),
    
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, 
      maxFiles: 5
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log') 
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log') 
    })
  ]
});

const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
      ip: req.ip,
      userId: req.user?.id || 'anonymous'
    });
  });
  
  next();
};

const businessLogger = {
  user: {
    register: (userId, email, role) => logger.info('USER_REGISTER', { userId, email, role }),
    login: (userId, email) => logger.info('USER_LOGIN', { userId, email }),
    logout: (userId, email) => logger.info('USER_LOGOUT', { userId, email }),
    updateProfile: (userId, updates) => logger.info('USER_UPDATE_PROFILE', { userId }),
    verify: (userId, byUserId) => logger.info('USER_VERIFIED', { userId, byUserId })
  },
  
  demande: {
    create: (demandeId, codeColis, userId, type) => 
      logger.info('DEMANDE_CREATED', { demandeId, codeColis, userId, type }),
    updateStatus: (demandeId, codeColis, oldStatus, newStatus, byUserId) => 
      logger.info('DEMANDE_STATUS_UPDATED', { demandeId, codeColis, oldStatus, newStatus, byUserId }),
    adjustWeight: (demandeId, codeColis, oldWeight, newWeight, byUserId) => 
      logger.info('DEMANDE_WEIGHT_ADJUSTED', { demandeId, codeColis, oldWeight, newWeight, byUserId })
  },
  
  payment: {
    proofUploaded: (proofId, codeColis, userId, amount) => 
      logger.info('PAYMENT_PROOF_UPLOADED', { proofId, codeColis, userId, amount }),
    statusUpdated: (paymentId, codeColis, oldStatus, newStatus, byUserId) => 
      logger.info('PAYMENT_STATUS_UPDATED', { paymentId, codeColis, oldStatus, newStatus, byUserId })
  },
  
  notification: {
    created: (notificationId, userId, type) => 
      logger.info('NOTIFICATION_CREATED', { notificationId, userId, type }),
    markedAsRead: (notificationId, userId) => 
      logger.info('NOTIFICATION_READ', { notificationId, userId })
  },
  
  error: (error, context = {}, userId = null) => 
    logger.error('ERROR', { message: error.message, context, userId }),
  
  warning: (message, context = {}, userId = null) => 
    logger.warn('WARNING', { message, context, userId }),
  
  info: (message, data = {}) => logger.info('INFO', { message, ...data }),
  
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.debug('DEBUG', { message, data });
    }
  }
};

module.exports = {
  logger,
  logRequest,
  businessLogger
};