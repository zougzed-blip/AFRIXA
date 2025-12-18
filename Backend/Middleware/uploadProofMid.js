const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const sharp = require('sharp'); // Installe: npm install sharp

const storage = multer.memoryStorage();

const upload3 = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Réduit à 5MB pour plus de stabilité
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/', 'application/pdf'];

    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images ou PDF sont autorisés !'), false);
    }
  }
});

// Middleware pour compresser les images
const compressImage = async (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return next();
  }
  
  try {
    // Redimensionner et compresser les images uniquement
    const compressedBuffer = await sharp(req.file.buffer)
      .resize({
        width: 1200,
        height: 1200,
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ 
        quality: 70,
        mozjpeg: true 
      })
      .toBuffer();
    
    // Mettre à jour le buffer
    req.file.buffer = compressedBuffer;
    req.file.size = compressedBuffer.length;
    
    console.log(`✅ Image compressée: ${(req.file.size / 1024).toFixed(2)}KB`);
    
    next();
  } catch (err) {
    console.log("⚠️ Compression échouée, continuation sans:", err.message);
    next(); // Continue même si la compression échoue
  }
};

const uploadToCloudinaryMiddleware3 = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const buffer = req.file.buffer;
    const folder = 'afrixa/paymentProofs';

    console.log(`📤 Début upload Cloudinary - Taille: ${(buffer.length / 1024).toFixed(2)}KB`);

    // ✅ AUGMENTER LE TIMEOUT POUR CLOUDINARY
    const result = await new Promise((resolve, reject) => {
      // Créer un timeout séparé
      const timeoutId = setTimeout(() => {
        reject(new Error('Upload Cloudinary timeout après 45 secondes'));
      }, 45000); // 45 secondes

      cloudinary.uploader.upload_stream(
        { 
          folder, 
          resource_type: "auto",
          type: 'upload',
          timeout: 60000 // Timeout Cloudinary à 60s
        },
        (err, result) => {
          clearTimeout(timeoutId); // Nettoyer le timeout
          if (err) {
            console.error('❌ Erreur Cloudinary détaillée:', err);
            reject(err);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });

    req.file.cloudinaryUrl = result.secure_url;
    req.file.cloudinaryPublicId = result.public_id;

    console.log(`✅ Upload Cloudinary réussi: ${result.secure_url}`);
    console.log(`📏 Taille uploadée: ${(result.bytes / 1024).toFixed(2)}KB`);
    
    next();
  } catch (err) {
    console.error('❌ Erreur Cloudinary:', err);
    
    
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Mode dev: Fallback local activé');
      
      const timestamp = Date.now();
      const originalName = req.file.originalname.replace(/\s+/g, '_');
      const fileName = `temp_${timestamp}_${originalName}`;
    
      req.file.cloudinaryUrl = `/uploads/temp/${fileName}`;
      req.file.isTemp = true;
      
      console.log(`📁 Fichier temporaire: ${req.file.cloudinaryUrl}`);
      next();
    } else {
      
      let errorMessage = 'Erreur lors de l\'upload vers Cloudinary';
      
      if (err.message.includes('timeout')) {
        errorMessage = 'L\'upload prend trop de temps. Essayez avec un fichier plus petit (max 2MB).';
      } else if (err.message.includes('File size too large')) {
        errorMessage = 'Le fichier est trop volumineux. Maximum 5MB.';
      }
      
      return res.status(500).json({ 
        success: false,
        message: errorMessage,
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
};

module.exports = { 
  upload3, 
  uploadToCloudinaryMiddleware3,
  compressImage 
};