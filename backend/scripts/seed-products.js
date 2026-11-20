require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Product = require('../models/product');
const User = require('../models/user');

const products = [
  { name: 'Dell Inspiron Laptop', description: 'Reliable Dell Inspiron laptop with a vivid display, modern processor, and campus-ready performance.', category: 'Laptops', price: 64990, condition: 'New', image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'HP Pavilion Laptop', description: 'Slim HP Pavilion laptop designed for study, work, entertainment, and everyday multitasking.', category: 'Laptops', price: 58990, condition: 'New', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'Lenovo IdeaPad Laptop', description: 'Portable Lenovo IdeaPad with clear visuals and efficient performance for college and office use.', category: 'Laptops', price: 46990, condition: 'New', image: 'https://images.unsplash.com/photo-1542393545-10f5cde2c810?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'ASUS VivoBook Laptop', description: 'Lightweight ASUS VivoBook featuring a modern metal-inspired design and responsive everyday performance.', category: 'Laptops', price: 54990, condition: 'New', image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'iPhone 15', description: 'Apple iPhone 15 with advanced camera capabilities, all-day performance, and a premium display.', category: 'Mobiles', price: 79900, condition: 'New', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'Samsung Galaxy S24', description: 'Samsung Galaxy S24 flagship smartphone with a premium camera system and vivid AMOLED display.', category: 'Mobiles', price: 74999, condition: 'New', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'OnePlus Smartphone', description: 'Fast and refined OnePlus smartphone with smooth software and quick charging support.', category: 'Mobiles', price: 34999, condition: 'New', image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'Redmi Smartphone', description: 'Value-focused Redmi smartphone with strong battery life and a large immersive display.', category: 'Mobiles', price: 14999, condition: 'New', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'Sony Wireless Headphones', description: 'Sony over-ear wireless headphones with comfortable cushions and immersive sound.', category: 'Headphones', price: 12990, condition: 'New', image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'JBL Bluetooth Headphones', description: 'JBL wireless headphones with punchy bass and reliable all-day battery performance.', category: 'Headphones', price: 7999, condition: 'New', image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'boAt Wireless Earbuds', description: 'Compact boAt wireless earbuds with clear calls, portable charging, and energetic sound.', category: 'Headphones', price: 2999, condition: 'New', image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'Logitech Gaming Mouse', description: 'Precision Logitech gaming mouse with programmable controls and ergonomic grip.', category: 'Gaming Accessories', price: 2499, condition: 'New', image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'Mechanical Gaming Keyboard', description: 'Mechanical gaming keyboard with tactile switches and responsive anti-ghosting keys.', category: 'Gaming Accessories', price: 4499, condition: 'New', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'Gaming Headset', description: 'Comfortable gaming headset with clear microphone audio and immersive surround sound.', category: 'Gaming Accessories', price: 3999, condition: 'New', image: 'https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'Xbox Controller', description: 'Wireless Xbox controller with responsive triggers and ergonomic precision grips.', category: 'Gaming Accessories', price: 5499, condition: 'New', image: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'Apple Smartwatch', description: 'Premium Apple smartwatch for fitness tracking, calls, notifications, and everyday wellness.', category: 'Smartwatches', price: 41900, condition: 'New', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'Samsung Smartwatch', description: 'Samsung smartwatch with health tracking, AMOLED display, and smooth notifications.', category: 'Smartwatches', price: 24999, condition: 'New', image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'Portable Bluetooth Speaker', description: 'Compact portable Bluetooth speaker with rich audio and easy wireless pairing.', category: 'Speakers', price: 4999, condition: 'New', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'USB-C Hub', description: 'Multi-port USB-C hub for laptops with HDMI, USB, card-reader, and charging support.', category: 'Computer Accessories', price: 2499, condition: 'New', image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'Laptop Backpack', description: 'Durable laptop backpack with padded compartments and weather-resistant campus-ready storage.', category: 'Computer Accessories', price: 2299, condition: 'New', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85', stock: 25 },
  { name: 'External SSD', description: 'Fast external solid-state drive for secure, compact, and portable file storage.', category: 'Computer Accessories', price: 8999, condition: 'New', image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1200&q=85', stock: 25 }
];

async function seedProducts() {
  await mongoose.connect(process.env.MONGO_URI);

  let seller = await User.findOne({ role: { $in: ['admin', 'seller'] } });

  if (!seller) {
    seller = await User.findOne();
  }

  if (!seller) {
    throw new Error('Create at least one user before running the product seed');
  }

  let inserted = 0;

  for (const product of products) {
    const existing = await Product.findOne({ name: product.name });

    if (!existing) {
      await Product.create({
        ...product,
        seller: seller._id
      });
      inserted += 1;
    }
  }

  console.log(`Seed complete. Inserted ${inserted} products; existing products were preserved.`);
  await mongoose.disconnect();
}

seedProducts().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exit(1);
});
