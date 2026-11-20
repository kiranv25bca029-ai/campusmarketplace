const express = require('express');
const QRCode = require('qrcode');
const authMiddleware = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const Order = require('../models/order');

const router = express.Router();
router.use(authMiddleware);

// GENERATE UPI QR CODE
router.post('/upi/create', async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const order = await Order.findOne({
      _id: orderId,
      buyer: req.user.id,
      paymentMethod: 'UPI',
      paymentStatus: 'Pending'
    });

    if (!order) {
      return res.status(404).json({ message: 'Pending UPI order not found' });
    }

    const merchantVpa = process.env.UPI_MERCHANT_ID || 'kiranvijayan19@okhdfcbank';
    const merchantName = process.env.UPI_MERCHANT_NAME || 'CampusMart';
    const transactionReference = `CAMPUS-${order._id.toString().slice(-10).toUpperCase()}`;

    const upiParams = new URLSearchParams({
      pa: merchantVpa,
      pn: merchantName,
      am: Number(order.totalAmount).toFixed(2),
      cu: 'INR',
      tn: `CampusMart ${transactionReference}`,
      tr: transactionReference
    });

    const upiUrl = `upi://pay?${upiParams.toString()}`;
    const qrCode = await QRCode.toDataURL(upiUrl);

    order.upiId = merchantVpa;
    order.upiPaymentReference = transactionReference;
    await order.save();

    res.json({
      message: 'UPI QR generated successfully',
      qrCode,
      upiUrl,
      amount: order.totalAmount,
      upiId: merchantVpa,
      recipientName: merchantName,
      transactionReference,
      paymentStatus: 'Pending'
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to generate UPI QR code' });
  }
});

router.post('/upi/submit', async (req, res) => {
  try {
    const { orderId, utr } = req.body;
    const normalizedUtr = utr?.trim();

    if (!orderId || !/^[A-Za-z0-9]{6,35}$/.test(normalizedUtr || '')) {
      return res.status(400).json({
        message: 'Enter a valid UPI UTR/transaction reference'
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      buyer: req.user.id,
      paymentMethod: 'UPI',
      paymentStatus: 'Pending'
    });

    if (!order) {
      return res.status(404).json({ message: 'Pending UPI order not found' });
    }

    const duplicate = await Order.findOne({
      _id: { $ne: order._id },
      transactionId: normalizedUtr,
      paymentStatus: 'Paid'
    });

    if (duplicate) {
      return res.status(409).json({ message: 'This UTR has already been used' });
    }

    order.transactionId = normalizedUtr;
    order.paymentStatus = 'Pending Verification';
    await order.save();

    res.json({
      message: 'UPI reference submitted. Payment remains pending until verified.',
      order
    });
  } catch (error) {
    res.status(400).json({ message: 'Unable to submit UPI reference' });
  }
});

router.patch('/upi/:orderId/verify', authorizeRoles('admin'), async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      paymentMethod: 'UPI',
      paymentStatus: 'Pending Verification'
    });

    if (!order) {
      return res.status(404).json({ message: 'UPI payment pending verification was not found' });
    }

    order.paymentStatus = 'Paid';
    order.orderStatus = 'Confirmed';
    await order.save();

    res.json({ message: 'UPI payment verified successfully', order });
  } catch (error) {
    res.status(400).json({ message: 'Unable to verify UPI payment' });
  }
});

module.exports = router;
