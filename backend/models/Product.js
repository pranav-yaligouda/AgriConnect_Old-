const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'lb', 'piece', 'dozen', 'bunch']
  },
  category: {
    type: String,
    required: true,
    enum: ['vegetables', 'fruits', 'grains', 'dairy', 'meat', 'poultry', 'other']
  },
  images: [{
    type: String
  }],
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
    location: {
    district: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    }
  },
  availableQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  minimumOrderQuantity: {
    type: Number,
    default: null
  },
  harvestDate: {
    type: Date,
    required: true
  },
  isOrganic: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  storageInfo: {
    type: String,
    default: ''
  },
  nutritionalInfo: {
    calories: {
      type: Number,
      default: 0
    },
    protein: {
      type: String,
      default: ''
    },
    carbs: {
      type: String,
      default: ''
    },
    fat: {
      type: String,
      default: ''
    },
    fiber: {
      type: String,
      default: ''
    },
    vitamins: {
      type: String,
      default: ''
    }
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for text search
productSchema.index({ name: 'text', description: 'text' });

// Add indexes for frequently queried fields
productSchema.index({ farmer: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isAvailable: 1 });

// Create the Product model
const Product = mongoose.model('Product', productSchema);

// Export the Product model
module.exports = Product;