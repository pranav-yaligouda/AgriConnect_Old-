const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');
const { validateProduct, productSchema } = require('../utils/orderProductValidation');

// Create a new product
const createProduct = async (req, res) => {
  try {
    // Validate product data
    const { error } = validateProduct(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Invalid product data',
        details: error.details
      });
    }
    // Optionally: Validate image uploads (type/size) here
    const product = new Product({
      ...req.body,
      farmer: req.user._id,
      minimumOrderQuantity: req.body.minimumOrderQuantity ?? null
    });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ message: 'Error creating product', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Get all products with optional filters
const getProducts = async (req, res) => {
  try {
    console.log('Received query params:', req.query);
    const { 
      category, 
      minPrice, 
      maxPrice, 
      district, 
      state, 
      search, 
      isOrganic,
      sort,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // Category filter (supports multiple categories)
    if (category) {
      query.category = { $in: category.split(',') };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Text search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Location filters
    if (district) query["location.district"] = district;
    if (state) query["location.state"] = state;

    // Modify the organic filter handling:
    if (typeof isOrganic !== 'undefined') {
     query.isOrganic = isOrganic === 'true';
    }

    // Sorting logic
    const sortOptions = {};
    switch(sort) {
      case 'price-asc':
        sortOptions.price = 1;
        break;
      case 'price-desc':
        sortOptions.price = -1;
        break;
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Fetch products and total count in parallel
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('farmer', 'name email phone location profileImage')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query)
    ]);

    res.json({
      products,
      total,
      page: pageNum,
      pageCount: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Full error:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
};

// Get a single product
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('farmer', 'name email phone location address profileImage')
      .populate('reviews.user', 'name');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

// Add this to productController.js
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(['all', ...categories]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

// Update getMyProducts controller
const getMyProducts = async (req, res) => {
  try {
    console.log(`Fetching products for farmer: ${req.user._id}`);
    const products = await Product.find({ farmer: req.user._id })
    .populate('farmer', 'name email phone location address profileImage') // Explicitly select fields
    .sort({ createdAt: -1 })
    .lean();

    console.log('Query results:', products);
    console.log(`Found ${products.length} products`);
    res.json(products);
  } catch (error) {
    console.error('Error in getMyProducts:', error);
    res.status(500).json({ 
      message: 'Error fetching products',
      error: error.message 
    });
  }
};

// Update a product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      farmer: req.user._id
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }
    // FIX: Correct validation call
    const { error } = validateProduct(req.body);
    if (error) {
      return res.status(400).json({ message: 'Invalid product data', details: error.details });
    }
    Object.assign(product, req.body);
    if (typeof req.body.minimumOrderQuantity !== 'undefined') {
      product.minimumOrderQuantity = req.body.minimumOrderQuantity;
    }
    await product.save();
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ message: 'Error updating product', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      farmer: req.user._id
    });
    if (!product) return res.status(404).json({ message: 'Product not found or unauthorized' });
    // Delete associated images
    product.images.forEach(image => {
      const filename = image.split('/').pop();
      const filePath = path.join(__dirname, '../uploads', filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Add a review to a product
const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Only allow users who are not the owner to review
    if (product.farmer.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot review your own product' });
    }
    // Validate rating
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    const review = {
      user: req.user._id,
      rating,
      comment
    };
    product.reviews.push(review);
    product.rating = calculateAverageRating(product.reviews);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(400).json({ message: 'Error adding review', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Helper function to calculate average rating
function calculateAverageRating(reviews) {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.length;
}



module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  addReview,
  getMyProducts,
  getCategories
}; 