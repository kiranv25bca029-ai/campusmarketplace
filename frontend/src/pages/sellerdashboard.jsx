import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

function SellerDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [productResponse, orderResponse] = await Promise.all([
        API.get('/products/seller/my', authHeaders()),
        API.get('/orders/seller/my', authHeaders())
      ]);

      setProducts(productResponse.data);
      setOrders(orderResponse.data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load seller dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Dashboard data loading updates state from an asynchronous API response.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, [loadDashboard]);

  const deleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return;

    try {
      await API.delete(`/products/${productId}`, authHeaders());
      setProducts((current) => current.filter((product) => product._id !== productId));
      setMessage('Product deleted successfully');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to delete product');
    }
  };

  const updateStatus = async (orderId, orderStatus) => {
    try {
      const response = await API.patch(`/orders/${orderId}/status`, { orderStatus }, authHeaders());
      setOrders((current) =>
        current.map((order) => order._id === orderId ? response.data.order : order)
      );
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to update order');
    }
  };

  const startEditing = (product) => {
    setEditing({
      _id: product._id,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      condition: product.condition,
      image: product.image || '',
      stock: product.stock
    });
  };

  const saveProduct = async (event) => {
    event.preventDefault();

    try {
      const response = await API.put(`/products/${editing._id}`, editing, authHeaders());
      setProducts((current) =>
        current.map((product) => product._id === editing._id ? response.data.product : product)
      );
      setEditing(null);
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to update product');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-100 p-8 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">SELLER CENTER</p>
            <h1 className="text-3xl font-bold text-slate-900">My Seller Dashboard</h1>
          </div>

          <div className="flex gap-3">
            <Link to="/" className="rounded-lg border bg-white px-4 py-2 font-semibold">
              Marketplace
            </Link>
            <Link to="/add-product" className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white">
              Add Product
            </Link>
          </div>
        </div>

        {message && (
          <p className="mb-6 rounded-lg border bg-white p-3 text-center text-sm">{message}</p>
        )}

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold">My Products ({products.length})</h2>

          {products.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center text-slate-500">
              You have not listed any products.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <article key={product._id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
                  <img
                    src={product.image || '/fallback-product.svg'}
                    alt={product.name}
                    className="h-44 w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = '/fallback-product.svg';
                    }}
                  />
                  <div className="p-4">
                    <p className="text-xs font-semibold text-blue-700">{product.category}</p>
                    <h3 className="mt-1 text-lg font-bold">{product.name}</h3>
                    <p className="mt-2 text-slate-600">₹{Number(product.price).toLocaleString('en-IN')}</p>
                    <p className="text-sm text-slate-500">Stock: {product.stock}</p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => startEditing(product)}
                        className="rounded-lg border border-blue-200 py-2 font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(product._id)}
                        className="rounded-lg border border-red-200 py-2 font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold">Customer Orders ({orders.length})</h2>

          {orders.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center text-slate-500">
              No customer orders yet.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <article key={order._id} className="rounded-xl border bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-bold">Order #{order._id.slice(-8)}</p>
                      <p className="text-sm text-slate-600">
                        {order.buyer?.fullName} · {order.buyer?.phone}
                      </p>
                      <p className="text-sm text-slate-500">{order.deliveryAddress}</p>
                    </div>

                    <select
                      value={order.orderStatus}
                      onChange={(event) => updateStatus(order._id, event.target.value)}
                      className="rounded-lg border px-3 py-2"
                    >
                      <option>Pending</option>
                      <option>Confirmed</option>
                      <option>Shipped</option>
                      <option>Delivered</option>
                      <option>Cancelled</option>
                    </select>
                  </div>

                  <div className="mt-4 border-t pt-4">
                    <p className="font-semibold">
                      Total: ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm text-slate-500">
                      Payment: {order.paymentMethod} · {order.paymentStatus}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {editing && (
          <section className="mb-8 rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">Edit Product</h2>
            <form onSubmit={saveProduct} className="grid gap-4 md:grid-cols-2">
              <input
                value={editing.name}
                onChange={(event) => setEditing((current) => ({ ...current, name: event.target.value }))}
                required
                className="rounded-lg border p-3"
                placeholder="Product name"
              />
              <input
                type="number"
                min="1"
                value={editing.price}
                onChange={(event) => setEditing((current) => ({ ...current, price: event.target.value }))}
                required
                className="rounded-lg border p-3"
                placeholder="Price"
              />
              <textarea
                value={editing.description}
                onChange={(event) => setEditing((current) => ({ ...current, description: event.target.value }))}
                required
                className="rounded-lg border p-3 md:col-span-2"
                placeholder="Description"
              />
              <select
                value={editing.category}
                onChange={(event) => setEditing((current) => ({ ...current, category: event.target.value }))}
                required
                className="rounded-lg border p-3"
              >
                <option>Laptops</option><option>Mobiles</option><option>Headphones</option>
                <option>Keyboards</option><option>Gaming Accessories</option>
                <option>Computer Accessories</option><option>Smartwatches</option>
                <option>Speakers</option><option>Other Electronics</option>
              </select>
              <select
                value={editing.condition}
                onChange={(event) => setEditing((current) => ({ ...current, condition: event.target.value }))}
                required
                className="rounded-lg border p-3"
              >
                <option>New</option><option>Like New</option><option>Good</option><option>Fair</option>
              </select>
              <input
                type="number"
                min="0"
                step="1"
                value={editing.stock}
                onChange={(event) => setEditing((current) => ({ ...current, stock: event.target.value }))}
                required
                className="rounded-lg border p-3"
                placeholder="Stock"
              />
              <input
                type="url"
                value={editing.image}
                onChange={(event) => setEditing((current) => ({ ...current, image: event.target.value }))}
                className="rounded-lg border p-3"
                placeholder="Image URL"
              />
              <div className="flex gap-3 md:col-span-2">
                <button type="submit" className="rounded-lg bg-blue-700 px-5 py-2 font-semibold text-white">Save Changes</button>
                <button type="button" onClick={() => setEditing(null)} className="rounded-lg border px-5 py-2 font-semibold">Cancel</button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}

export default SellerDashboard;
