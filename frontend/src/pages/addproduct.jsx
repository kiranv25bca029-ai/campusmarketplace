import { useState } from 'react';
import API from '../api';

function AddProduct() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    condition: '',
    image: '',
    stock: 1
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      let productImage = formData.image;

      if (imageFile) {
        const imageData = new FormData();
        imageData.append('image', imageFile);

        const uploadResponse = await API.post('/products/upload-image', imageData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        productImage = uploadResponse.data.image;
      }

      const response = await API.post(
        '/products/add',
        { ...formData, image: productImage },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage(response.data.message);

      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        condition: '',
        image: '',
        stock: 1
      });
      setImageFile(null);
      setImagePreview('');

    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Product upload failed!'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-xl rounded-xl bg-white p-8 shadow-lg"
      >
        <h1 className="mb-6 text-center text-3xl font-bold text-blue-700">
          Add New Product
        </h1>

        <input
          name="name"
          placeholder="Product Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mb-4 w-full rounded-lg border p-3"
        />

        <textarea
          name="description"
          placeholder="Product Description"
          value={formData.description}
          onChange={handleChange}
          required
          className="mb-4 w-full rounded-lg border p-3"
        />

        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="mb-4 w-full rounded-lg border p-3"
        >
          <option value="">Select Category</option>
          <option value="Laptops">Laptops</option>
          <option value="Mobiles">Mobiles</option>
          <option value="Headphones">Headphones</option>
          <option value="Keyboards">Keyboards</option>
          <option value="Gaming Accessories">Gaming Accessories</option>
          <option value="Computer Accessories">Computer Accessories</option>
          <option value="Smartwatches">Smartwatches</option>
          <option value="Speakers">Speakers</option>
          <option value="Other Electronics">Other Electronics</option>
        </select>

        <input
          type="number"
          name="price"
          placeholder="Product Price"
          value={formData.price}
          onChange={handleChange}
          required
          min="1"
          className="mb-4 w-full rounded-lg border p-3"
        />

        <select
          name="condition"
          value={formData.condition}
          onChange={handleChange}
          required
          className="mb-4 w-full rounded-lg border p-3"
        >
          <option value="">Select Condition</option>
          <option value="New">New</option>
          <option value="Like New">Like New</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
        </select>

        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Upload Product Photo or Enter Image URL
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(event) => {
            const file = event.target.files?.[0] || null;
            setImageFile(file);
            setImagePreview(file ? URL.createObjectURL(file) : '');
          }}
          className="mb-3 w-full rounded-lg border p-3"
        />
        <p className="mb-2 text-xs text-slate-500">Image uploads must be under 5 MB.</p>
        <input
          type="url"
          name="image"
          placeholder="https://example.com/product-photo.jpg"
          value={formData.image}
          onChange={handleChange}
          className="mb-3 w-full rounded-lg border p-3"
        />

        <div className="mb-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <img
            src={imagePreview || (formData.image.trim().startsWith('/uploads/') ? `http://localhost:5000${formData.image.trim()}` : formData.image.trim()) || '/fallback-product.svg'}
            alt="Product preview"
            className="h-48 w-full object-cover"
            onError={(event) => {
              event.currentTarget.src = '/fallback-product.svg';
            }}
          />
        </div>

        <input
          type="number"
          name="stock"
          placeholder="Stock Quantity"
          value={formData.stock}
          onChange={handleChange}
          min="1"
          required
          className="mb-4 w-full rounded-lg border p-3"
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white hover:bg-blue-800"
        >
          Add Product
        </button>

        {message && (
          <p className={`mt-4 text-center text-sm ${
            message.toLowerCase().includes('success')
              ? 'text-green-700'
              : 'text-red-700'
          }`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

export default AddProduct;