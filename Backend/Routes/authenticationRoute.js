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
  upload.fields([
    { name: 'clientPhoto', maxCount: 1 },
    { name: 'petitLogo', maxCount: 1 },
    { name: 'grandLogo', maxCount: 1 },
    { name: 'agenceLogo', maxCount: 1 }
  ]),
  register
)
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-2fa',verify2FA)
router.post('/refresh-token', refreshToken)


module.exports = router;