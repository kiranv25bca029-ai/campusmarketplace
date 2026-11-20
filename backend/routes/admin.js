const express = require('express');
const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');
const authMiddleware = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

const router = express.Router();

router.use(authMiddleware, authorizeRoles('admin'));

router.get('/stats', async (req, res) => {
  try {
    const [users, products, orders] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments()
    ]);

    const revenueResult = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      users,
      products,
      orders,
      revenue: revenueResult[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load dashboard statistics' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('fullName email phone role createdAt').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load users' });
  }
});

router.patch('/users/:id/role', async (req, res) => {
  try {
    const allowedRoles = ['buyer', 'seller', 'admin'];

    if (!allowedRoles.includes(req.body.role)) {
      return res.status(400).json({ message: 'Invalid user role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true, runValidators: true }
    ).select('fullName email phone role');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(400).json({ message: 'Unable to update user role' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    const ownedProducts = await Product.countDocuments({ seller: req.params.id });
    const existingOrders = await Order.countDocuments({
      $or: [
        { buyer: req.params.id },
        { 'products.product': { $in: await Product.find({ seller: req.params.id }).distinct('_id') } }
      ]
    });

    if (ownedProducts > 0 || existingOrders > 0) {
      return res.status(409).json({
        message: 'Cannot delete this user because they have products or orders. Change the role or remove related records first.'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Unable to delete user' });
  }
});

router.get('/products', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('seller', 'fullName email')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load products' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const activeOrder = await Order.findOne({
      'products.product': req.params.id,
      orderStatus: { $in: ['Pending', 'Confirmed', 'Shipped'] }
    });

    if (activeOrder) {
      return res.status(409).json({
        message: 'Cannot remove this product while active orders reference it.'
      });
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product removed successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Unable to remove product' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('buyer', 'fullName email phone')
      .populate('products.product', 'name image')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load orders' });
  }
});

router.patch('/orders/:id/status', async (req, res) => {
  try {
    const allowedStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

    if (!allowedStatuses.includes(req.body.orderStatus)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.body.orderStatus === 'Cancelled' && order.orderStatus !== 'Cancelled') {
      for (const item of order.products) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }

      if (order.paymentStatus === 'Paid') {
        order.paymentStatus = 'Refunded';
      }
    }

    order.orderStatus = req.body.orderStatus;
    await order.save();

    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    res.status(400).json({ message: 'Unable to update order status' });
  }
});

router.patch('/users/:id/account', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.params.id }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Email is already in use' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.email = normalizedEmail;

    if (password || confirmPassword) {
      user.password = password;
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('fullName email phone role');

    res.json({
      message: 'Account details updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(400).json({ message: 'Unable to update account details' });
  }
});

router.patch('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.body.name !== undefined) product.name = req.body.name;
    if (req.body.description !== undefined) product.description = req.body.description;
    if (req.body.category !== undefined) product.category = req.body.category;
    if (req.body.condition !== undefined) product.condition = req.body.condition;
    if (req.body.image !== undefined) product.image = req.body.image;

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

    await product.save();
    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to update product' });
  }
});

module.exports = router;
