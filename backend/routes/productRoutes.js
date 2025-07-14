const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { auth, authorize } = require('../middleware/auth');
const { getCategories } = require('../controllers/productController');

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
router.get('/:id', getProduct);

// Protected routes
router.use(auth); // JWT auth middleware to all following routes

//alluserposts route(for future)



// Farmer-specific routes
router.get('/farmer/my-products', authorize('farmer'), getMyProducts);
router.post('/', authorize('farmer'), createProduct);
router.patch('/:id', authorize('farmer'), updateProduct);
router.delete('/:id', authorize('farmer'), deleteProduct);


module.exports = router; 