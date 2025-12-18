const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    ).end(buffer);
  });
};

const deleteFromCloudinary = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
  } catch (error) {
    console.log('Erreur suppression Cloudinary :', error);
    throw error;
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
