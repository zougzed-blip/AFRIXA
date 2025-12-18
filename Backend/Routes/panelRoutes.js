const express = require('express')
const router = express.Router()
const authMiddleware = require('../Middleware/authenticationMiddlware')
const {roleMiddleware,verifiedMiddleware, blockedMiddleware} = require('../Middleware/RoleMiddlware')
const adminMiddleware = require('../Middleware/administrationMiddleware')      

router.get('/client/dashboard',
   authMiddleware, 
   roleMiddleware('client'),
   (req, res) => {
  res.json({ message: 'Bienvenue Client !' })
});

router.get('/agence/dashboard', 
  authMiddleware, 
  roleMiddleware('agence'), 
  verifiedMiddleware, 
  (req, res) => {
    res.json({ message: 'Bienvenue Agence !' })
});


router.get('/admin/dashboard', authMiddleware, 
  adminMiddleware, 
  roleMiddleware('admin'), 
  (req, res) => {
  res.json({ message: 'Bienvenue Admin !' })
});

router.get('/petitTrans/dashboard', 
  authMiddleware, 
  roleMiddleware('petit_transporteur'),
  verifiedMiddleware, 
  (req, res) => {
    res.json({ message: 'Bienvenue Petit Transporteur !' })
});


router.get('/grandTrans/dashboard', 
  authMiddleware, 
  roleMiddleware('grand_transporteur'),
  verifiedMiddleware, 
  (req, res) => {
    res.json({ message: 'Bienvenue Grand Transporteur !' })
});

module.exports = router
