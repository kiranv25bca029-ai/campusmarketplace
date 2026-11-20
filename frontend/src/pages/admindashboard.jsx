import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, revenue: 0 });
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [accountForm, setAccountForm] = useState({
    userId: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [statsResponse, usersResponse, productsResponse, ordersResponse] = await Promise.all([
        API.get('/admin/stats', authHeaders()),
        API.get('/admin/users', authHeaders()),
        API.get('/admin/products', authHeaders()),
        API.get('/admin/orders', authHeaders())
      ]);

      setStats(statsResponse.data);
      setUsers(usersResponse.data);
      setProducts(productsResponse.data);
      setOrders(ordersResponse.data);

      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (storedUser?.id) {
        const currentAdmin = usersResponse.data.find((user) => user._id === storedUser.id);
        if (currentAdmin) {
          setAccountForm({
            userId: currentAdmin._id,
            email: currentAdmin.email,
            password: '',
            confirmPassword: ''
          });
        }
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load admin dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Dashboard data loading updates state from an asynchronous API response.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, [loadDashboard]);

  const updateRole = async (userId, role) => {
    try {
      const response = await API.patch(`/admin/users/${userId}/role`, { role }, authHeaders());
      setUsers((current) =>
        current.map((user) => user._id === userId ? response.data.user : user)
      );
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to update role');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;

    try {
      const response = await API.delete(`/admin/users/${userId}`, authHeaders());
      setUsers((current) => current.filter((user) => user._id !== userId));
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to delete user');
    }
  };

  const removeProduct = async (productId) => {
    if (!window.confirm('Remove this product listing?')) return;

    try {
      const response = await API.delete(`/admin/products/${productId}`, authHeaders());
      setProducts((current) => current.filter((product) => product._id !== productId));
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to remove product');
    }
  };

  const updateOrderStatus = async (orderId, orderStatus) => {
    try {
      const response = await API.patch(
        `/admin/orders/${orderId}/status`,
        { orderStatus },
        authHeaders()
      );
      setOrders((current) =>
        current.map((order) => order._id === orderId ? response.data.order : order)
      );
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to update order');
    }
  };

  const verifyUPIPayment = async (orderId) => {
    if (!window.confirm('Verify that this UPI payment was received in your account?')) return;

    try {
      const response = await API.patch(
        `/payments/upi/${orderId}/verify`,
        {},
        authHeaders()
      );
      setOrders((current) =>
        current.map((order) => order._id === orderId ? response.data.order : order)
      );
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to verify UPI payment');
    }
  };

  const selectAccount = (user) => {
    setAccountForm({
      userId: user._id,
      email: user.email,
      password: '',
      confirmPassword: ''
    });
  };

  const updateAccount = async (event) => {
    event.preventDefault();

    if (!accountForm.userId) {
      setMessage('Select a user to edit');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(accountForm.email)) {
      setMessage('Please enter a valid email address');
      return;
    }

    if (accountForm.password && accountForm.password !== accountForm.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (accountForm.password && accountForm.password.length < 6) {
      setMessage('Password must contain at least 6 characters');
      return;
    }

    try {
      const response = await API.patch(
        `/admin/users/${accountForm.userId}/account`,
        {
          email: accountForm.email,
          password: accountForm.password,
          confirmPassword: accountForm.confirmPassword
        },
        authHeaders()
      );

      setUsers((current) =>
        current.map((user) =>
          user._id === accountForm.userId ? response.data.user : user
        )
      );

      setAccountForm((current) => ({
        ...current,
        password: '',
        confirmPassword: ''
      }));
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to update account');
    }
  };

  const updateProduct = async (product) => {
    const priceInput = window.prompt('Product price', String(product.price));
    if (priceInput === null) return;

    const stockInput = window.prompt('Product stock', String(product.stock));
    if (stockInput === null) return;

    try {
      const response = await API.patch(
        `/admin/products/${product._id}`,
        { price: priceInput, stock: stockInput },
        authHeaders()
      );
      setProducts((current) =>
        current.map((item) => item._id === product._id ? response.data.product : item)
      );
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to update product');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-100 p-8 text-center">Loading admin dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">ADMINISTRATION</p>
            <h1 className="text-3xl font-bold">CampusMart Admin Dashboard</h1>
          </div>
          <Link to="/" className="rounded-lg border bg-white px-4 py-2 font-semibold">
            Marketplace
          </Link>
        </div>

        {message && (
          <p className="mb-6 rounded-lg border bg-white p-3 text-center text-sm">{message}</p>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Registered Users', stats.users],
            ['Products', stats.products],
            ['Orders', stats.orders],
            ['Revenue', `₹${Number(stats.revenue).toLocaleString('en-IN')}`]
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-bold text-blue-700">{value}</p>
            </div>
          ))}
        </div>

        <section className="mb-8 rounded-xl border bg-white p-5">
          <h2 className="mb-4 text-xl font-bold">Account Settings</h2>
          {accountForm.userId && (
            <p className="mb-4 text-sm text-sky-600">
              Editing selected account: {accountForm.email}
            </p>
          )}
          <form onSubmit={updateAccount} className="grid gap-4 md:grid-cols-2">
            <input
              type="email"
              value={accountForm.email}
              onChange={(event) =>
                setAccountForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="Select a user, then edit email"
              required
              className="rounded-lg border p-3"
            />

            <div />

            <input
              type="password"
              value={accountForm.password}
              onChange={(event) =>
                setAccountForm((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="New password (optional)"
              minLength={6}
              className="rounded-lg border p-3"
            />

            <input
              type="password"
              value={accountForm.confirmPassword}
              onChange={(event) =>
                setAccountForm((current) => ({
                  ...current,
                  confirmPassword: event.target.value
                }))
              }
              placeholder="Confirm new password"
              minLength={6}
              className="rounded-lg border p-3"
            />

            <button
              type="submit"
              disabled={!accountForm.userId}
              className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white md:col-span-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save Account Details
            </button>
          </form>
        </section>

        <section className="mb-8 rounded-xl border bg-white p-5">
          <h2 className="mb-4 text-xl font-bold">Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-slate-500">
                  <th className="py-3">Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b last:border-0">
                    <td className="py-3 font-semibold">{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(event) => updateRole(user._id, event.target.value)}
                        className="rounded border px-2 py-1"
                      >
                        <option>buyer</option>
                        <option>seller</option>
                        <option>admin</option>
                      </select>
                    </td>
                    <td>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => selectAccount(user)}
                          className="text-sm font-semibold text-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteUser(user._id)}
                          className="text-sm font-semibold text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8 rounded-xl border bg-white p-5">
          <h2 className="mb-4 text-xl font-bold">Products</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article key={product._id} className="rounded-lg border p-4">
                <h3 className="font-bold">{product.name}</h3>
                <p className="text-sm text-slate-500">
                  {product.category} · ₹{Number(product.price).toLocaleString('en-IN')}
                </p>
                <p className="mt-1 text-sm">Seller: {product.seller?.fullName || 'Unknown'}</p>
                <p className="mt-1 text-sm text-slate-500">Stock: {product.stock}</p>
                <div className="mt-3 flex gap-4">
                  <button
                    type="button"
                    onClick={() => updateProduct(product)}
                    className="text-sm font-semibold text-blue-700"
                  >
                    Edit Listing
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProduct(product._id)}
                    className="text-sm font-semibold text-red-600"
                  >
                    Remove Listing
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 text-xl font-bold">Orders</h2>
          <div className="space-y-3">
            {orders.map((order) => (
              <article key={order._id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
                <div>
                  <p className="font-bold">Order #{order._id.slice(-8)}</p>
                  <p className="text-sm text-slate-500">
                    {order.buyer?.fullName} · ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                  </p>
                  {order.paymentMethod === 'UPI' && (
                    <p className="mt-1 text-xs text-slate-500">
                      UPI UTR: {order.transactionId || 'Not submitted'} · {order.paymentStatus}
                    </p>
                  )}
                </div>
                <select
                  value={order.orderStatus}
                  onChange={(event) => updateOrderStatus(order._id, event.target.value)}
                  className="rounded border px-3 py-2"
                >
                  <option>Pending</option>
                  <option>Confirmed</option>
                  <option>Shipped</option>
                  <option>Delivered</option>
                  <option>Cancelled</option>
                </select>
                {order.paymentMethod === 'UPI' && order.paymentStatus === 'Pending Verification' && (
                  <button
                    type="button"
                    onClick={() => verifyUPIPayment(order._id)}
                    className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Verify UPI Payment
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;
