const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  logout,
  verify2FA,
  forgotPassword, 
  resetPassword, 
  upload ,
  refreshToken
} = require('../Controllers/AuthenticationController');
router.post(
  '/register',
  register
)
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-2fa',verify2FA)
router.post('/refresh-token', refreshToken)


module.exports = router;