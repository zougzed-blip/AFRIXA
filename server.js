require('dotenv').config({ debug: true });
console.log('🔥 MONGO_URI =', process.env.MONGO_URI ? '✅' : '❌');
console.log('🔥 JWT_SECRET =', process.env.JWT_SECRET ? '✅' : '❌');

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
const rateLimit = require('express-rate-limit');
const { logRequest } = require('./Backend/config/logger');
const cors = require('cors');
const csrf = require('csurf');
const { businessLogger } = require('./Backend/config/logger');

const { validateEnv } = require('./Backend/config/envValidators');
validateEnv();
(async () => {
  try {
    await MyMongoConnection();
    console.log('MongoDB connecté, démarrage du serveur...');
    
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

    app.use(cookieParser());

    // ==================== CSRF ====================
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

    // ==================== MIDDLEWARE ====================
    app.use(logRequest);
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // ==================== RATE LIMITING ====================
    const adminLimiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      max: parseInt(process.env.RATE_LIMIT_MAX_ADMIN) || 1000,
      message: { error: 'Trop de requêtes admin' }
    });

    const clientLimiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      max: parseInt(process.env.RATE_LIMIT_MAX_CLIENT) || 500,
      message: { error: 'Trop de requêtes client' }
    });

    const agenceLimiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      max: parseInt(process.env.RATE_LIMIT_MAX_AGENCE) || 300,
      message: { error: 'Trop de requêtes agence' }
    });

    const loginLimiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      max: parseInt(process.env.RATE_LIMIT_MAX_LOGIN) || 5,
      message: { error: 'Trop de tentatives de connexion' }
    });

    app.use('/api/admin', adminLimiter);
    app.use('/api/auth/login', loginLimiter);
    app.use('/api/client', clientLimiter);
    app.use('/api/', agenceLimiter);

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

    // ==================== DASHBOARDS ====================
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
      res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
      });
    });

    app.use((req, res) => {
      res.status(404).json({ success: false, message: 'Route not found' });
    });

    // ==================== DÉMARRAGE ====================
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(` Serveur lancé sur le port ${port}`);
      console.log(`Environnement: ${process.env.NODE_ENV || 'production'}`);
      console.log(` CORS: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });

  } catch (error) {
    console.error('ERREUR FATALE AU DÉMARRAGE:', error.message);
    process.exit(1);
  }
})();
