const Product = require('../models/Product');
// Validation is now handled by centralized middleware
const productNames = require('../config/productNames');
const { fileTypeFromBuffer } = require('file-type');
const cloudinary = require('../utils/cloudinary');

// Create a new product
const createProduct = async (req, res) => {
  try {
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);
    // Parse location if sent as JSON string
    if (typeof req.body.location === 'string') {
      try {
        req.body.location = JSON.parse(req.body.location);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid location format' });
      }
    }
    // --- Robust image validation ---
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'At least one image file is required.' });
    }
    if (files.length > 3) {
      return res.status(400).json({ message: 'A maximum of 3 images are allowed.' });
    }
    // Validate and upload each image
    const imageUrls = [];
    for (const file of files) {
      if (!file.buffer) {
        return res.status(400).json({ message: 'File buffer missing.' });
      }
      const fileType = await fileTypeFromBuffer(file.buffer);
      if (!fileType || !['image/jpeg', 'image/png', 'image/webp'].includes(fileType.mime)) {
        return res.status(400).json({ message: 'Invalid image file type. Only JPEG, PNG, and WEBP are allowed.' });
      }
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload_stream_to_cloudinary(file.buffer);
      imageUrls.push(result.secure_url);
    }
    // --- Create product only if all images are valid and uploaded ---
    const product = new Product({
      ...req.body,
      farmer: req.user._id,
      minimumOrderQuantity: req.body.minimumOrderQuantity ?? null,
      images: imageUrls,
    });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ message: error.message || 'Error creating product' });
  }
};

// Get all products with optional filters
const getProducts = async (req, res) => {
  try {
    const query = {};

    // Category filter (supports multiple categories)
    if (req.query.category) {
      // Defensive: handle array or comma-separated string, and ignore 'all' and empty
      let catArr = Array.isArray(req.query.category) ? req.query.category : req.query.category.split(',');
      catArr = catArr.filter(c => c && c !== 'all');
      if (catArr.length > 0) {
        query.category = { $in: catArr };
      }
    }

    // Filter by product name key
    if (req.query.name) {
      query.name = req.query.name;
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    // Text search filter
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Location filters
    if (req.query.district) query["location.district"] = req.query.district;
    if (req.query.state) query["location.state"] = req.query.state;

    // Modify the organic filter handling:
    if (typeof req.query.isOrganic !== 'undefined') {
     query.isOrganic = req.query.isOrganic === 'true';
    }

    // Sorting logic
    const sortOptions = {};
    switch(req.query.sort) {
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
    const pageNum = Math.max(1, parseInt(req.query.page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20)); // max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Fetch products and total count in parallel
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('farmer', 'name email phone location address profileImageUrl')
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
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const product = await Product.findOne({ _id: { $eq: id } })
      .populate('farmer', 'name email phone location address profileImageUrl')
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
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const product = await Product.findOne({
      _id: { $eq: id },
      farmer: req.user._id
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
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
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const product = await Product.findOneAndDelete({
      _id: { $eq: id },
      farmer: req.user._id
    });
    if (!product) return res.status(404).json({ message: 'Product not found or unauthorized' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
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

// Multer+Cloudinary product image upload handler (to be used in route)
// Usage: router.post('/:id/images', auth, authorize('farmer'), upload.array('images', 5), uploadProductImages)
const uploadProductImages = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }
    if (req.files.length > 3) {
      return res.status(400).json({ message: 'A maximum of 3 images are allowed.' });
    }
    const imageUrls = [];
    for (const file of req.files) {
      if (!file.buffer) {
        return res.status(400).json({ message: 'File buffer missing.' });
      }
      const fileType = await fileTypeFromBuffer(file.buffer);
      if (!fileType || !['image/jpeg', 'image/png'].includes(fileType.mime)) {
        return res.status(400).json({ message: 'Invalid image type. Only JPEG and PNG are allowed.' });
      }
      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'agriconnect/product_images' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(file.buffer);
      });
      imageUrls.push(uploadResult.secure_url);
    }
    product.images.push(...imageUrls);
    await product.save();
    res.json({ urls: imageUrls });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading product images', error: error.message });
  }
};

// Helper function to calculate average rating
function calculateAverageRating(reviews) {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.length;
}

// Add this controller to serve product names by category
const getProductNames = (req, res) => {
  const { category } = req.query;
  if (!category || !productNames[category]) {
    return res.status(400).json({ message: 'Invalid category' });
  }
  res.json(productNames[category]);
};


module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  addReview,
  getMyProducts,
  getCategories,
  uploadProductImages, // Export the new handler
  getProductNames,
}; 