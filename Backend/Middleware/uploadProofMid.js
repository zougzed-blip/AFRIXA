const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const sharp = require('sharp'); 

const storage = multer.memoryStorage();

const upload3 = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
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

const compressImage = async (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return next();
  }
  
  try {

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
    
    
    req.file.buffer = compressedBuffer;
    req.file.size = compressedBuffer.length;
    
     
    next();
  } catch (err) {
    next()
  }
};

const uploadToCloudinaryMiddleware3 = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const buffer = req.file.buffer;
    const folder = 'afrixa/paymentProofs';

    const result = await new Promise((resolve, reject) => {

      const timeoutId = setTimeout(() => {
        reject(new Error('Upload Cloudinary timeout après 45 secondes'));
      }, 45000);

      cloudinary.uploader.upload_stream(
        { 
          folder, 
          resource_type: "auto",
          type: 'upload',
          timeout: 60000 
        },
        (err, result) => {
          clearTimeout(timeoutId)
          if (err) {
            console.error(' Erreur Cloudinary détaillée:', err);
            reject(err);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });

    req.file.cloudinaryUrl = result.secure_url;
    req.file.cloudinaryPublicId = result.public_id;

    next();
  } catch (err) {

    if (process.env.NODE_ENV === 'development') {
 
      const timestamp = Date.now();
      const originalName = req.file.originalname.replace(/\s+/g, '_');
      const fileName = `temp_${timestamp}_${originalName}`;
    
      req.file.cloudinaryUrl = `/uploads/temp/${fileName}`;
      req.file.isTemp = true;
  
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