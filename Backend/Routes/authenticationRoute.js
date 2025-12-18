const express = require('express');
const router = express.Router();
const { register, login, upload } = require('../Controllers/AuthenticationController');
const User = require('../Models/User')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')

router.post(
  '/register',
  upload.fields([
    { name: 'clientPhoto', maxCount: 1 },
    { name: 'petitLogo', maxCount: 1 },
    { name: 'grandLogo', maxCount: 1 },
    { name: 'agenceLogo', maxCount: 1 }
  ]),
  register
);

router.post('/login', login)

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email introuvable' });

    // Générer un token
    const token = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await user.save();

    // Config Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // ton email
        pass: process.env.EMAIL_PASS, // ton mot de passe ou app password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Réinitialisation du mot de passe',
      html: `
        <p>Bonjour,</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
        <a href="http://localhost:3000/reset-password?token=${token}">Réinitialiser le mot de passe</a>
        <p>Ce lien expire dans 1 heure.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Email envoyé ! Vérifie ta boîte mail.' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ message: 'Données manquantes' });

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Token invalide ou expiré' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Mot de passe changé avec succès !' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
