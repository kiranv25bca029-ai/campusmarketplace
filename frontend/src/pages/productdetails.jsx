import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../api';

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await API.get(`/products/${id}`);
        setProduct(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load product');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-slate-100 p-10 text-center">Loading product...</div>;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-100 p-10 text-center">
        <p className="mb-5 text-red-600">{error || 'Product not found'}</p>
        <Link to="/" className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const addToCart = () => {
    const cartKey = 'campusmart-cart';

    let cart;
    try {
      cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      if (!Array.isArray(cart)) cart = [];
    } catch {
      cart = [];
    }

    const existing = cart.find((item) => item.id === product._id);
    let updatedCart;

    if (existing) {
      updatedCart = cart.map((item) =>
        item.id === product._id
          ? { ...item, quantity: Math.min(product.stock, item.quantity + 1) }
          : item
      );
    } else {
      updatedCart = [...cart, { id: product._id, quantity: 1 }];
    }

    localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <Link to="/" className="mb-6 inline-block font-semibold text-blue-700">
          ← Back to Marketplace
        </Link>

        <div className="grid gap-8 overflow-hidden rounded-2xl border bg-white p-6 shadow-xl md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border bg-slate-900">
            <img
              src={product.image || '/fallback-product.svg'}
              alt={product.name}
              className="h-72 w-full object-contain sm:h-96 md:h-[420px]"
              onError={(event) => {
                event.currentTarget.src = '/fallback-product.svg';
              }}
            />
          </div>

          <div className="flex flex-col justify-center">
            <p className="mb-2 text-sm font-semibold text-blue-700">
              {product.category}
            </p>
            <h1 className="text-4xl font-bold">{product.name}</h1>
            <p className="mt-4 leading-relaxed text-slate-500">
              {product.description}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-slate-500">Condition</p>
                <p className="mt-1 font-bold">{product.condition}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-slate-500">Stock Available</p>
                <p className="mt-1 font-bold">{product.stock} units</p>
              </div>
            </div>

            <p className="mt-6 text-3xl font-bold text-sky-600">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </p>

            <button
              type="button"
              onClick={addToCart}
              disabled={product.stock < 1}
              className="mt-6 rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white disabled:opacity-50"
            >
              {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
