const multer = require('multer');
const cloudinary = require('../config/cloudinary');

const storage = multer.memoryStorage();

const upload2 = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées!'), false);
    }
  }
});

// Middleware pour upload vers Cloudinary
const uploadToCloudinaryMiddleware2 = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(); // Pas de fichier, on continue
    }

    const buffer = req.file.buffer;
    const folder = 'afrixa/transportRequests'; // ✅ CHANGER LE DOSSIER
    
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      ).end(buffer);
    });

    req.file.cloudinaryUrl = result.secure_url;
    req.file.cloudinaryPublicId = result.public_id;

    next();
  } catch (err) {
    console.error('Erreur Cloudinary:', err);
    return res.status(500).json({ message: 'Erreur lors de l\'upload de l\'image' });
  }
};

module.exports = { upload2, uploadToCloudinaryMiddleware2 };