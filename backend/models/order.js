const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },

        quantity: {
          type: Number,
          required: true,
          min: 1
        },

        price: {
          type: Number,
          required: true
        }
      }
    ],

    customerName: {
      type: String,
      required: true
    },

    mobileNumber: {
      type: String,
      required: true
    },

    deliveryAddress: {
      type: String,
      required: true
    },

    totalAmount: {
      type: Number,
      required: true
    },

    paymentMethod: {
      type: String,
      enum: ['Cash on Delivery', 'UPI'],
      default: 'Cash on Delivery'
    },

    upiId: {
      type: String,
      default: ''
    },

    transactionId: {
      type: String,
      default: ''
    },

    upiPaymentReference: {
      type: String,
      default: ''
    },

    paymentStatus: {
      type: String,
      enum: ['Pending', 'Pending Verification', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending'
    },

    orderStatus: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending'
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ 'products.product': 1, orderStatus: 1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);