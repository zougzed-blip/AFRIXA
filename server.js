require('dotenv').config();
const express = require('express');
const path = require('path');
const MyMongoConnection = require('./Backend/DataBase/MongoConnection');
const cookieParser = require('cookie-parser');
const authenticationRoute = require('./Backend/Routes/authenticationRoute');
const panelRoutes = require('./Backend/Routes/panelRoutes');
const authMiddleware = require('./Backend/Middleware/authenticationMiddlware')
const roleMiddleware = require('./Backend/Middleware/RoleMiddlware')
const adminRoutes = require('./Backend/Routes/adminRoutes');
const grandTansportRouter = require('./Backend/Routes/grandTransportRoutes')
const clientrisquestRouter = require('./Backend/Routes/clientRoutes')
const adminMiddleware = require('./Backend/Middleware/administrationMiddleware')
const paymentProofRoutes = require('./Backend/Routes/paymentProofRoutes');
const notificationRoutes = require('./Backend/Routes/notificationRoutes');
const clientrecupGrandTrans = require('./Backend/Routes/clientRecupGrandTrans')
const GrandTransportOffer = require('./Backend/Routes/GrandTransOfferRoutes');
const profileRoutes = require('./Backend/Routes/userProfilrRoutes');
const historyRoutes = require('./Backend/Routes/historyRoutes');
const badgeRoutes = require('./Backend/Routes/badgeRoutes');
const User = require('./Backend/Models/User');

MyMongoConnection();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'Public')))
app.use(express.static(path.join(__dirname, 'images')))

// ==================== API ROUTES ====================
app.use('/api/auth', authenticationRoute);
app.use('/api/admin', authMiddleware, adminMiddleware, adminRoutes)
app.use('/api/client', grandTansportRouter);
app.use('/api/client', clientrisquestRouter);
app.use('/api/client', notificationRoutes);  
app.use('/api', paymentProofRoutes);         
app.use('/api/panel', panelRoutes);
app.use('/api/', clientrecupGrandTrans);
app.use('/api/', GrandTransportOffer);
app.use('/api/', profileRoutes);
app.use('/api/', historyRoutes);
app.use('/api/', badgeRoutes);


// ==================== PAGE ROUTES ====================
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

// ==================== DASHBOARD ROUTES ====================
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

app.get('/petitTrans/dashboard', authMiddleware, async (req, res) => {
  if (req.user.role !== 'petit_transporteur') {
    return res.redirect('/authorization.html');
  }  

  const user = await User.findById(req.user.id);
  if (!user.isVerified) return res.redirect('/waitingVerification');

  res.sendFile(path.join(__dirname, 'Public', 'petitTrans.html'));
});

app.get('/grandTrans/dashboard', authMiddleware, async (req, res) => {
  if (req.user.role !== 'grand_transporteur') {
    return res.redirect('/authorization.html');
  }

  const user = await User.findById(req.user.id);
  if (!user.isVerified) return res.redirect('/waitingVerification');

  res.sendFile(path.join(__dirname, 'Public', 'grandTrans.html'));
});

app.get('/agence/dashboard', authMiddleware, async (req, res) => {
  if (req.user.role !== 'agence') {
    return res.redirect('/authorization.html');
  }

  const user = await User.findById(req.user.id);
  if (!user.isVerified) return res.redirect('/waitingVerification');

  res.sendFile(path.join(__dirname, 'Public', 'agenceExpedition.html'));
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(` Server is running on port ${port}`);
});