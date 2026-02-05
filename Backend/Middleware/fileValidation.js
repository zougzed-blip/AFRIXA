const multer = require('multer');
const path = require('path');

const ALLOWED_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  documents: ['application/pdf']
};

const MAX_SIZE = 5 * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  const allowedTypes = [...ALLOWED_TYPES.images, ...ALLOWED_TYPES.documents];
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Type de fichier non autorisé. Seuls JPG, PNG, WEBP et PDF sont acceptés.'), false);
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Extension de fichier non autorisée.'), false);
  }
  
  cb(null, true);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
   
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_SIZE,
    files: 1
  }
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Fichier trop volumineux (max 5MB)' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ success: false, message: 'Trop de fichiers envoyés' });
    }
  }
  
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  
  next();
};

module.exports = { upload, handleMulterError };