const multer = require('multer');
const cloudinary = require('../config/Cloudinary');


const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});


const uploadMiddlewareRegister = async (req, res, next) => {
  try {

    
    if (!req.file) {
      return next();
    }

    const buffer = req.file.buffer;
    const folder = 'user_photos';
    
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (err, result) => {
          if (err) {
                return reject(err);
          }
          resolve(result);
        }
      ).end(buffer);
    });
    req.body.photoUrl = result.secure_url;
    req.body.photoPublicId = result.public_id;

    next();
  } catch (err) {
    res.status(500).json({ message: 'Erreur Cloudinary: ' + err.message });
  }
}
module.exports = { upload, uploadMiddlewareRegister };
