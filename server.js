require('dotenv').config();
const { validateEnv } = require('./Backend/config/envValidators');
validateEnv();
  
const express = require('express');
const path = require('path');
const MyMongoConnection = require('./Backend/DataBase/MongoConnection');
const cookieParser = require('cookie-parser');
const authenticationRoute = require('./Backend/Routes/authenticationRoute');
const panelRoutes = require('./Backend/Routes/panelRoutes');
const authMiddleware = require('./Backend/Middleware/authenticationMiddlware')
const roleMiddleware = require('./Backend/Middleware/RoleMiddlware')
const adminRoutes = require('./Backend/Routes/adminRoutes');
const clientrisquestRouter = require('./Backend/Routes/clientRoutes')
const adminMiddleware = require('./Backend/Middleware/administrationMiddleware')
const paymentProofRoutes = require('./Backend/Routes/paymentProofRoutes');
const notificationRoutes = require('./Backend/Routes/notificationRoutes');
const profileRoutes = require('./Backend/Routes/userProfilrRoutes');
const agenceRoutes = require('./Backend/Routes/agenceRoutes');
const User = require('./Backend/Models/User');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { logRequest } = require('./Backend/config/logger');
const cors = require('cors'); 
const csrf = require('csurf');
const { businessLogger } = require('./Backend/config/logger');

MyMongoConnection().catch(err => {
  console.error(' MONGODB FATAL:', err.message);
  process.exit(1);
});
const app = express();

// ==================== CORS ====================
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
};
app.use(cors(corsOptions));

// ==================== SÉCURITÉ ====================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      scriptSrcElem: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:", "*"],
      formAction: ["'self'", "https://formspree.io"],
      connectSrc: ["'self'", "*"],
      frameSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'self'"]
    }
  }
}));

// ==================== COOKIE PARSER ====================
app.use(cookieParser());

// ==================== CSRF PROTECTION ====================
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
});

app.get('/api/csrf-token', csrfProtection,  (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// ==================== SANITIZATION MIDDLEWARE ====================
const sanitizationMiddleware = (req, res, next) => {
  const sanitizeForNoSQL = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = Array.isArray(obj) ? [] : {};
    const dangerousKeys = ['$', 'where', 'mapReduce', 'group', 'eval', 'function'];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const hasDollarOperator = Object.keys(value).some(k => k.startsWith('$'));
        if (hasDollarOperator) {
          businessLogger.warning('NoSQL $ operator in nested object blocked', {
            path: fullPath,
            operators: Object.keys(value),
            ip: req.ip
          });
          continue;
        }
      }
      
      const isDangerous = dangerousKeys.some(dangerous => 
        key.toLowerCase().includes(dangerous.toLowerCase())
      );
      
      if (isDangerous) {
        businessLogger.warning('NoSQL dangerous key detected and removed', {
          key: key,
          ip: req.ip,
          url: req.url
        });
        continue;
      }
      
      if (value && typeof value === 'object') {
        sanitized[key] = sanitizeForNoSQL(value, fullPath);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  };

  if (req.body) req.body = sanitizeForNoSQL(req.body);
  if (req.query) req.query = sanitizeForNoSQL(req.query);
  if (req.params) req.params = sanitizeForNoSQL(req.params);
  next();
};

// ==================== XSS SANITIZATION ====================
const xssSanitizationMiddleware = (req, res, next) => {
  const sanitize = (obj, isRoot = true) => {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        const dangerousPatterns = [
          /<script\b[^>]*>/i,
          /<\/script>/i,
          /javascript:/i,
          /on\w+\s*=/i,
          /eval\s*\(/i,
          /alert\s*\(/i,
          /document\.cookie/i,
          /localStorage/i,
          /sessionStorage/i,
          /\.src\s*=/i
        ];
        
        let sanitizedValue = value;
        let hasDangerous = false;
        
        for (const pattern of dangerousPatterns) {
          if (pattern.test(value)) {
            hasDangerous = true;
            sanitizedValue = sanitizedValue.replace(pattern, '');
            businessLogger.warning('XSS pattern removed', {
              pattern: pattern.toString(),
              key: key,
              ip: req.ip,
              truncatedValue: value.substring(0, 50)
            });
          }
        }

        if (value.includes('{$') || /\$(\w+)\s*:/.test(value)) {
          hasDangerous = true;
          businessLogger.warning('NoSQL in string detected', {
            value: value.substring(0, 100),
            ip: req.ip,
            key: key
          });
          sanitizedValue = sanitizedValue.replace(/\{\$/g, '{').replace(/\$\w+\s*:/g, '');
        }
        
        sanitized[key] = hasDangerous ? sanitizedValue : value;
        
      } else if (value && typeof value === 'object') {
        sanitized[key] = sanitize(value, false);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  };
  
  try {
    if (req.body) req.body = sanitize(req.body);
    next();
  } catch (error) {
    businessLogger.error('Sanitization error', {
      error: error.message,
      ip: req.ip,
      url: req.url
    });
    return res.status(400).json({ 
      error: 'Invalid input detected',
      message: error.message 
    });
  }
};

// ==================== SECURITY HEADERS ====================
const securityMiddleware = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

// ==================== RATE LIMITING ====================
const adminLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_ADMIN) || 1000,
  message: { error: 'Trop de requêtes admin, réessayez plus tard' }
});

const clientLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_CLIENT) || 500,
  message: { error: 'Trop de requêtes client, réessayez plus tard' }
});

const agenceLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_AGENCE) || 300,
  message: { error: 'Trop de requêtes agence, réessayez plus tard' }
});

const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_LOGIN) || 5,
  message: { error: 'Trop de tentatives de connexion' }
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many refresh requests' }
});

// ==================== MIDDLEWARE ORDER ====================
app.use(logRequest);
app.use(securityMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(sanitizationMiddleware);
app.use(xssSanitizationMiddleware);

const csrfExcludedPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/forgot-password', 
  '/api/auth/reset-password',
  '/api/csrf-token'
];

app.use((req, res, next) => {
  if (req.method === 'GET' ||
      req.path.includes('.') ||
      csrfExcludedPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  csrfProtection(req, res, next);
});
// ==================== APPLIQUER RATE LIMITING ====================
app.use('/api/admin', adminLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/client', clientLimiter);
app.use('/api/', agenceLimiter);
app.post('/api/auth/refresh', refreshLimiter);

// ==================== STATIC FILES ====================
app.use(express.static(path.join(__dirname, 'Public')));
app.use(express.static(path.join(__dirname, 'images')));

// ==================== ROUTES ====================
app.use('/api/auth', authenticationRoute);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientrisquestRouter);
app.use('/api/', agenceRoutes);
app.use('/api/client', notificationRoutes);
app.use('/api/', paymentProofRoutes);
app.use('/api/panel', panelRoutes);
app.use('/api/', profileRoutes);

// ==================== PAGES ====================
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'inscription.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'connexion.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'forgot-password.html'));
});

app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'reset-password.html'));
});

app.get('/waitingVerification', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'waitingVerification.html'));
});

app.get('/authorization', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'authorization.html'));
});

// ==================== DASHBOARDS ====================
app.get('/admin/dashboard', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.redirect('/authorization.html');
  }
  res.sendFile(path.join(__dirname, 'Public', 'Administration.html'));
});

app.get('/client/dashboard', authMiddleware, async (req, res) => {
  if (req.user.role !== 'client') {
    return res.redirect('/authorization.html');
  }
  const user = await User.findById(req.user.id);
  if (!user.isVerified) return res.redirect('/waitingVerification');
  res.sendFile(path.join(__dirname, 'Public', 'client.html'));
});

app.get('/agence/dashboard', authMiddleware, async (req, res) => {
  if (req.user.role !== 'agence') {
    return res.redirect('/authorization.html');
  }
  const user = await User.findById(req.user.id);
  if (!user.isVerified) return res.redirect('/waitingVerification');
  res.sendFile(path.join(__dirname, 'Public', 'agenceExpedition.html'));
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    businessLogger.warning('CSRF token validation failed', {
      ip: req.ip,
      url: req.url,
      method: req.method
    });
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }
  
  businessLogger.error(err, {
    context: 'server_error',
    ip: req.ip,
    url: req.url
  });
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(` Serveur lancé sur le port ${port}`);
  console.log(` Environnement: ${process.env.NODE_ENV || 'production'}`);
  console.log(` CORS activé pour: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(` CSRF Protection: Activée`);
  console.log(` Sanitization: Activée`);
});
