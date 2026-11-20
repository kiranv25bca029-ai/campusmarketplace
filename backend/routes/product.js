console.log("PRODUCT ROUTE FILE LOADED");
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Product = require('../models/product');
const Order = require('../models/order');
const authMiddleware = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

const router = express.Router();
const uploadDirectory = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${crypto.randomUUID()}${extension}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype)) {
      return callback(new Error('Upload a JPG, PNG, WebP, or AVIF image'));
    }
    callback(null, true);
  }
});

const allowedCategories = [
  'Laptops', 'Mobiles', 'Headphones', 'Keyboards',
  'Gaming Accessories', 'Computer Accessories',
  'Smartwatches', 'Speakers', 'Other Electronics'
];

router.get('/test', (req, res) => {
  res.json({ message: 'Product Route Working!' });
});

router.post('/upload-image', authMiddleware, authorizeRoles('seller', 'admin'), (req, res) => {
  imageUpload.single('image')(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message || 'Image upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Choose an image to upload' });
    }

    return res.status(201).json({
      image: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
    });
  });
});

// Add a new product
router.post('/add', authMiddleware, authorizeRoles('seller', 'admin'), async (req, res) => {
  try {
    const { name, description, category, price, condition, image, stock } = req.body;

    if (!name?.trim() || !description?.trim() || !category || !condition) {
      return res.status(400).json({ message: 'Please provide all required product details' });
    }

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid product category' });
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (!Number.isFinite(numericPrice) || numericPrice < 1) {
      return res.status(400).json({ message: 'Price must be at least 1' });
    }

    if (!Number.isInteger(numericStock) || numericStock < 0) {
      return res.status(400).json({ message: 'Stock must be a whole number of 0 or more' });
    }

    if (!isSafeImage(image)) {
      return res.status(400).json({ message: 'Invalid image URL' });
    }

    const product = await Product.create({
      seller: req.user.id,
      name: name.trim(),
      description: description.trim(),
      category,
      price: numericPrice,
      condition,
      image: image?.trim() || '/fallback-product.svg',
      stock: numericStock
    });

    res.status(201).json({
      message: 'Product added successfully!',
      product
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all products, optionally filtered
router.get('/', async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice } = req.query;
    const filter = {};

    if (search?.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    if (category && allowedCategories.includes(category)) {
      filter.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice) || 0;
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice) || 0;
    }

    const products = await Product.find(filter)
      .populate('seller', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load products' });
  }
});

// Get products listed by the logged-in seller
router.get('/seller/my', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load seller products' });
  }
});

// Get one product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'fullName email');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Invalid product ID' });
  }
});

// Update product
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const isOwner = product.seller.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only manage your own products' });
    }

    const allowedFields = ['name', 'description', 'category', 'price', 'condition', 'image', 'stock'];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    if (req.body.category && !allowedCategories.includes(req.body.category)) {
      return res.status(400).json({ message: 'Invalid product category' });
    }

    if (req.body.price !== undefined) {
      const price = Number(req.body.price);
      if (!Number.isFinite(price) || price < 1) {
        return res.status(400).json({ message: 'Price must be at least 1' });
      }
      product.price = price;
    }

    if (req.body.stock !== undefined) {
      const stock = Number(req.body.stock);
      if (!Number.isInteger(stock) || stock < 0) {
        return res.status(400).json({ message: 'Stock must be a whole number of 0 or more' });
      }
      product.stock = stock;
    }

    if (req.body.image && !isSafeImage(req.body.image)) {
      return res.status(400).json({ message: 'Invalid image URL' });
    }

    await product.save();
    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete product
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const isOwner = product.seller.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only delete your own products' });
    }

    // Check if the product is associated with any active orders
    const activeOrder = await Order.findOne({
      'products.product': product._id,
      orderStatus: { $in: ['Pending', 'Confirmed', 'Shipped'] }
    });

    if (activeOrder) {
      return res.status(409).json({
        message: 'Cannot delete a product with active orders. Cancel or complete the orders first.'
      });
    }

    await product.deleteOne();
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Unable to delete product' });
  }
});

const isSafeImage = (value) => {
  if (!value) return true;
  if (value.startsWith('/uploads/') || value === '/fallback-product.svg') return true;

  try {
    const url = new URL(value);
    if (url.protocol === 'https:') return true;
    return url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
  } catch {
    return false;
  }
};

console.log("PRODUCT ROUTER EXPORTED");
module.exports = router;