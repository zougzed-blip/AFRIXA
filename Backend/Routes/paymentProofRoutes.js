const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authenticationMiddlware');
const { roleMiddleware } = require('../Middleware/RoleMiddlware');
const { upload3, uploadToCloudinaryMiddleware3, compressImage } = require('../Middleware/uploadProofMid');
const paymentProofController = require('../Controllers/paymentProofController');

router.post(
  "/upload-payment-proof",
  authMiddleware,
  upload3.single("proofFile"),
  compressImage,
  uploadToCloudinaryMiddleware3,
  paymentProofController.uploadPaymentProof
);

module.exports = router;