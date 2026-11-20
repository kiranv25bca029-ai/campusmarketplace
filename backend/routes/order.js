const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/order');
const Product = require('../models/product');
const authMiddleware = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

const router = express.Router();

// Place a new order
router.post('/', authMiddleware, async (req, res) => {
  const decrements = [];
  try {
    const {
  products,
  customerName,
  mobileNumber,
  deliveryAddress,
  paymentMethod = 'Cash on Delivery',
  transactionId = ''
} = req.body;

    const allowedMethods = ['Cash on Delivery', 'UPI'];

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    if (!customerName?.trim() || !mobileNumber?.trim() || !deliveryAddress?.trim()) {
      return res.status(400).json({ message: 'Please provide all delivery details' });
    }

    if (!/^\d{10}$/.test(mobileNumber.trim())) {
      return res.status(400).json({ message: 'Mobile number must contain 10 digits' });
    }

    if (products.some((item) =>
      !mongoose.Types.ObjectId.isValid(String(item?.product)) ||
      !Number.isInteger(Number(item?.quantity)) ||
      Number(item.quantity) < 1
    )) {
      return res.status(400).json({ message: 'One or more cart items are invalid' });
    }

    const quantitiesByProduct = new Map();

    for (const item of products) {
      const productId = String(item.product);
      const quantity = Number(item.quantity);
      quantitiesByProduct.set(
        productId,
        (quantitiesByProduct.get(productId) || 0) + quantity
      );
    }

    let orderProducts = [];
    let totalAmount = 0;

    for (const [productId, quantity] of quantitiesByProduct) {
      const product = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      );

      if (!product) {
        for (const decrement of decrements) {
          await Product.findByIdAndUpdate(decrement.productId, {
            $inc: { stock: decrement.quantity }
          });
        }
        decrements.length = 0;

        const existing = await Product.findById(productId);
        if (!existing) {
          return res.status(404).json({ message: 'Product not found' });
        }

        return res.status(400).json({
          message: `Only ${existing.stock} units of ${existing.name} are available`
        });
      }

      decrements.push({ productId: product._id, quantity });

      orderProducts.push({
        product: product._id,
        quantity,
        price: product.price
      });

      totalAmount += product.price * quantity;
    }

    const order = await Order.create({
        buyer: req.user.id,
        products: orderProducts,
        customerName: customerName.trim(),
        mobileNumber: mobileNumber.trim(),
        deliveryAddress: deliveryAddress.trim(),
        totalAmount,
        paymentMethod,
        upiId: paymentMethod === 'UPI' ? (process.env.UPI_MERCHANT_ID || 'kiranvijayan19@okhdfcbank') : '',
        transactionId: '',
        paymentStatus: 'Pending',
        orderStatus: 'Pending'
      });

    return res.status(201).json({
      message: 'Order placed successfully!',
      order
    });
  } catch (error) {
    for (const decrement of decrements) {
      await Product.findByIdAndUpdate(decrement.productId, {
        $inc: { stock: decrement.quantity }
      }).catch(() => {});
    }

    res.status(error.status || 500).json({
      message: error.status ? error.message : 'Unable to place order'
    });
  }
});

// Get orders for the logged-in buyer
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate('products.product', 'name image price')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load order history' });
  }
});

// Cancel pending or confirmed buyer orders
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      buyer: req.user.id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['Pending', 'Confirmed'].includes(order.orderStatus)) {
      return res.status(400).json({
        message: 'This order can no longer be cancelled'
      });
    }

    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    order.orderStatus = 'Cancelled';

    if (order.paymentStatus === 'Paid') {
      order.paymentStatus = 'Refunded';
    }

    await order.save();

    res.status(200).json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    res.status(400).json({ message: 'Unable to cancel order' });
  }
});

// Get orders containing products from the logged-in seller
router.get('/seller/my', authMiddleware, authorizeRoles('seller', 'admin'), async (req, res) => {
  try {
    const sellerProducts = await Product.find({ seller: req.user.id }).select('_id');
    const sellerProductIds = sellerProducts.map((product) => product._id);

    const orders = await Order.find({
      'products.product': { $in: sellerProductIds }
    })
      .populate('buyer', 'fullName email phone')
      .populate('products.product', 'name image seller')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load seller orders' });
  }
});

// Update order status for an order containing the seller's product
router.patch('/:id/status', authMiddleware, authorizeRoles('seller', 'admin'), async (req, res) => {
  try {
    const allowedStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

    if (!allowedStatuses.includes(req.body.orderStatus)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const sellerProductIds = await Product.find({ seller: req.user.id }).distinct('_id');

    const order = await Order.findOne({
      _id: req.params.id,
      'products.product': { $in: sellerProductIds }
    });

    if (!order) {
      return res.status(404).json({
        message: 'Order not found or it does not contain your product'
      });
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

    res.status(200).json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    res.status(400).json({ message: 'Unable to update order status' });
  }
});

module.exports = router;