const multer = require('multer');
const cloudinary = require('../config/cloudinary');


const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});


const uploadMiddlewareRegister = async (req, res, next) => {
  try {
    console.log('=== UPLOAD MIDDLEWARE START ===');
    console.log('File exists?', !!req.file);
    
    if (!req.file) {
      console.log('No file, skipping Cloudinary');
      return next();
    }

    console.log('Uploading to Cloudinary...');
    const buffer = req.file.buffer;
    const folder = 'user_photos';
    
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (err, result) => {
          if (err) {
            console.error('Cloudinary upload error:', err);
            return reject(err);
          }
          console.log('Cloudinary success:', result);
          resolve(result);
        }
      ).end(buffer);
    });

    console.log('Cloudinary URL:', result.secure_url);
    req.body.photoUrl = result.secure_url;
    req.body.photoPublicId = result.public_id;

    next();
  } catch (err) {
    console.error('Middleware error:', err);
    res.status(500).json({ message: 'Erreur Cloudinary: ' + err.message });
  }
}
module.exports = { upload, uploadMiddlewareRegister };
