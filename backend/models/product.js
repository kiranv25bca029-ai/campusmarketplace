const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120
    },

    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },

    category: {
        type: String,
        enum: [
            'Laptops', 'Mobiles', 'Headphones', 'Keyboards',
            'Gaming Accessories', 'Computer Accessories',
            'Smartwatches', 'Speakers', 'Other Electronics'
        ],
        required: true
    },

    price: {
        type: Number,
        required: true,
        min: 1
    },

    condition: {
        type: String,
        enum: ['New', 'Like New', 'Good', 'Fair'],
        required: true
    },

    image: {
        type: String,
        default: '/fallback-product.svg',
        trim: true
    },

    stock: {
        type: Number,
        default: 1,
        min: 0,
        validate: {
            validator: Number.isInteger,
            message: 'Stock must be a whole number'
        }
    }

}, { timestamps: true });

productSchema.index({ category: 1, price: 1, createdAt: -1 });
productSchema.index({ name: 'text' });
productSchema.index({ seller: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);