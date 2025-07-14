const Joi = require('joi');

const orderSchema = Joi.object({
  items: Joi.array().items({
    product: Joi.string().required(),
    quantity: Joi.number().min(1).required()
  }).min(1).required(),
  deliveryAddress: Joi.object({
    street: Joi.string(),
    district: Joi.string().required(),
    state: Joi.string().required(),
    zipcode: Joi.string()
  }).required(),
  paymentMethod: Joi.string().valid('cod', 'online').required()
});

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

const validateOrder = (data) => {
  return orderSchema.validate(data, { abortEarly: false });
};

const validateProduct = (data) => {
  return productSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateOrder,
  validateProduct,
  orderSchema,
  productSchema
};
