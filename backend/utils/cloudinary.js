const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const profileImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'agriconnect/profile_images',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 300, height: 300, crop: 'limit' }],
  },
});

const productImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'agriconnect/product_images',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
  },
});

module.exports = {
  cloudinary,
  profileImageStorage,
  productImageStorage,
}; 