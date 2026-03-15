require('dotenv').config();

const express = require('express');
const path = require('path');
const MyMongoConnection = require('./Backend/DataBase/MongoConnection');
const cookieParser = require('cookie-parser');
const authenticationRoute = require('./Backend/Routes/authenticationRoute');
const panelRoutes = require('./Backend/Routes/panelRoutes');
const authMiddleware = require('./Backend/Middleware/authenticationMiddlware');
const adminRoutes = require('./Backend/Routes/adminRoutes');
const clientrisquestRouter = require('./Backend/Routes/clientRoutes');
const paymentProofRoutes = require('./Backend/Routes/paymentProofRoutes');
const notificationRoutes = require('./Backend/Routes/notificationRoutes');
const profileRoutes = require('./Backend/Routes/userProfilrRoutes');
const agenceRoutes = require('./Backend/Routes/agenceRoutes');
const User = require('./Backend/Models/User');
const helmet = require('helmet');
const adminExchangeRoutes = require('./Backend/Routes/adminExchangeRoutes')
const rateLimit = require('express-rate-limit');
const { logRequest, businessLogger } = require('./Backend/config/logger');
const cors = require('cors');
const csrf = require('csurf');
const { validateEnv } = require('./Backend/config/envValidators');
const { notFoundHandler, authErrorHandler } = require('./Backend/Middleware/errorPagemid');

validateEnv();

(async () => {
  try {
    await MyMongoConnection();
    
    const app = express();

    // Force HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      app.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] !== 'https') {
          return res.redirect(`https://${req.headers.host}${req.url}`);
        }
        next();
      });
    }

    const corsOptions = {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
    };
    app.use(cors(corsOptions));

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

    app.use(cookieParser());
   
    const csrfProtection = csrf({
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      }
    });

    app.get('/api/csrf-token', csrfProtection, (req, res) => {
      res.json({ csrfToken: req.csrfToken() });
    });

    app.use(logRequest);
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  try {
    
    const sanitizeValue = (value) => {
      if (typeof value === 'string') {
    
        return value
          .replace(/[<>]/g, (match) => {
            return match === '<' ? '&lt;' : '&gt;';
          })
          .replace(/\$/g, '&#36;')
          .replace(/\{/g, '&#123;')
          .replace(/\}/g, '&#125;');
      }
      return value;
    };

    if (req.body && typeof req.body === 'object') {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeValue(req.body[key]);
        }
        else if (req.body[key] && typeof req.body[key] === 'object') {
          Object.keys(req.body[key]).forEach(subKey => {
            if (typeof req.body[key][subKey] === 'string') {
              req.body[key][subKey] = sanitizeValue(req.body[key][subKey]);
            }
          });
        }
      });
    }

    if (req.query && typeof req.query === 'object') {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitizeValue(req.query[key]);
        }
      });
    }

    
    if (req.params && typeof req.params === 'object') {
      Object.keys(req.params).forEach(key => {
        if (typeof req.params[key] === 'string') {
          req.params[key] = sanitizeValue(req.params[key]);
        }
      });
    }

    next();
  } catch (error) {
    
    businessLogger.warn('Sanitization error:', { 
      message: error.message,
      path: req.path 
    });
    next(); 
  }
});

    const adminLimiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      max: parseInt(process.env.RATE_LIMIT_MAX_ADMIN) || 5000,
      message: { success: false, error: 'Trop de requêtes admin. Veuillez patienter quelques minutes.' },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.user?.id || req.ip
    });

    const clientLimiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      max: parseInt(process.env.RATE_LIMIT_MAX_CLIENT) || 2000,
      message: { success: false, error: 'Trop de requêtes client. Veuillez patienter quelques minutes.' },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.user?.id || req.ip
    });

    const agenceLimiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      max: parseInt(process.env.RATE_LIMIT_MAX_AGENCE) || 1500,
      message: { success: false, error: 'Trop de requêtes agence. Veuillez patienter quelques minutes.' },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.user?.id || req.ip
    });

    const loginLimiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      max: parseInt(process.env.RATE_LIMIT_MAX_LOGIN) || 5,
      message: { success: false, error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true
    });

    app.use('/api/admin', adminLimiter);
    app.use('/api/admin', adminExchangeRoutes);
    app.use('/api/auth/login', loginLimiter);
    app.use('/api/client', clientLimiter);
    app.use('/api/', agenceLimiter);

    app.use(express.static(path.join(__dirname, 'Public')));
    app.use(express.static(path.join(__dirname, 'images')));

    app.use('/api/auth', authenticationRoute);
    app.use('/api/admin', adminRoutes);
    app.use('/api/client', clientrisquestRouter);
    app.use('/api/', agenceRoutes);
    app.use('/api/client', notificationRoutes);
    app.use('/api/', paymentProofRoutes);
    app.use('/api/panel', panelRoutes);
    app.use('/api/', profileRoutes);
   

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

    app.get('/404', (req, res) => {
      res.sendFile(path.join(__dirname, 'Public', '404.html'));
    });

    app.get('/401', (req, res) => {
      res.sendFile(path.join(__dirname, 'Public', '401.html'));
    });

    app.get('/admin/dashboard', authMiddleware, async (req, res) => {
      if (req.user.role !== 'admin') return res.redirect('/authorization.html');
      res.sendFile(path.join(__dirname, 'Public', 'Administration.html'));
    });

    app.get('/client/dashboard', authMiddleware, async (req, res) => {
      if (req.user.role !== 'client') return res.redirect('/authorization.html');
      const user = await User.findById(req.user.id);
      if (!user?.isVerified) return res.redirect('/waitingVerification');
      res.sendFile(path.join(__dirname, 'Public', 'client.html'));
    });

    app.get('/agence/dashboard', authMiddleware, async (req, res) => {
      if (req.user.role !== 'agence') return res.redirect('/authorization.html');
      const user = await User.findById(req.user.id);
      if (!user?.isVerified) return res.redirect('/waitingVerification');
      res.sendFile(path.join(__dirname, 'Public', 'agenceExpedition.html'));
    });

    // ==================== ERROR HANDLER ====================
    app.use((err, req, res, next) => {
      if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({ success: false, message: 'Invalid CSRF token' });
      }
      
      businessLogger.error('Server error:', {
        message: err.message,
        // stack: err.stack,  // Masqué
        path: req.path,
        method: req.method
      });

      if (req.path.startsWith('/api/')) {
        return res.status(err.status || 500).json({
          success: false,
          message: 'Internal server error'
        });
      }
      
      res.redirect('/404');
    });

    app.use('/api', (req, res) => {
      res.status(404).json({ success: false, message: 'Route not found' });
    });

    app.use(authErrorHandler);
    app.use(notFoundHandler);

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      businessLogger.info(`Server started successfully on port ${port}`, {
        environment: process.env.NODE_ENV || 'production',
        corsOrigin: process.env.FRONTEND_URL || 'http://localhost:3000'
      });
    });

  } catch (error) {
    businessLogger.error('Fatal error during startup:', {
      message: error.message,
      // stack: error.stack  // Masqué
    });
    process.exit(1);
  }
})();