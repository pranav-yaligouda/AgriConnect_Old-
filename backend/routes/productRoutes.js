const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { auth, authorize } = require('../middleware/auth');
const { getCategories } = require('../controllers/productController');
const multer = require('multer');
const { productImageStorage } = require('../utils/cloudinary');
// Use memory storage for product creation and image upload
const memoryUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
const upload = multer({ storage: productImageStorage, limits: { fileSize: 5 * 1024 * 1024 } }); // for other routes if needed

const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getMyProducts
} = require('../controllers/productController');


// Public routes
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/names', productController.getProductNames);
router.get('/:id', getProduct);

// Protected routes
router.use(auth); // JWT auth middleware to all following routes

//alluserposts route(for future)



// Farmer-specific routes
router.get('/farmer/my-products', authorize('farmer'), getMyProducts);
router.post('/', authorize('farmer'), memoryUpload.array('images', 3), createProduct);
router.patch('/:id', authorize('farmer'), updateProduct);
router.delete('/:id', authorize('farmer'), deleteProduct);
router.post('/:id/images', authorize('farmer'), memoryUpload.array('images', 3), productController.uploadProductImages);


module.exports = router; 