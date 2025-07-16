const Joi = require('joi');
const productNames = require('../config/productNames');

const productSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().min(0).required(),
  category: Joi.string().required(),
  availableQuantity: Joi.number().min(0).required(),
  unit: Joi.string().required(),
  images: Joi.array().items(Joi.string()).default([]),
  isOrganic: Joi.boolean().default(false),
  harvestDate: Joi.date().default(new Date()).required(),
  location: Joi.object({
    district: Joi.string().required(),
    state: Joi.string().required()
  }).required(),
  minimumOrderQuantity: Joi.number().allow(null),
});

function validateProductName(category, key) {
  if (!productNames[category]) return false;
  return productNames[category].some(item => item.key === key);
}

const validateProduct = (data) => {
  // Joi validation first
  const joiResult = productSchema.validate(data, { abortEarly: false });
  if (joiResult.error) return joiResult;
  // Custom validation for product name key
  if (!validateProductName(data.category, data.name)) {
    return {
      error: {
        details: [{ message: 'Invalid product name for category', path: ['name'] }]
      }
    };
  }
  return joiResult;
};

module.exports = {
  validateProduct,
  validateProductName,
  productSchema
};
