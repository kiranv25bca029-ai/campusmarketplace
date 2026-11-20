import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders, cancelOrder } from '../services/orderservice';

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load your orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load order history asynchronously from the authenticated API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders();
  }, []);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;

    try {
      const response = await cancelOrder(orderId);
      setOrders((current) =>
        current.map((order) =>
          order._id === orderId ? response.order : order
        )
      );
      setMessage(response.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to cancel order');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 p-8 text-center">
        Loading your orders...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">MY ACCOUNT</p>
            <h1 className="text-3xl font-bold text-slate-900">Order History</h1>
          </div>
          <Link
            to="/"
            className="rounded-lg border bg-white px-4 py-2 font-semibold"
          >
            Continue Shopping
          </Link>
        </div>

        {message && (
          <p className="mb-6 rounded-lg border bg-white p-3 text-center text-sm">
            {message}
          </p>
        )}

        {orders.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center">
            <p className="text-slate-500">You have not placed any orders yet.</p>
            <Link
              to="/"
              className="mt-5 inline-block rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <article
                key={order._id}
                className="rounded-xl border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
                  <div>
                    <p className="font-bold">Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-700">
                      ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm text-slate-500">
                      {order.paymentMethod} · {order.paymentStatus}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 py-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Order Status</p>
                    <p className="mt-1 font-bold text-slate-900">{order.orderStatus}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Delivery Address</p>
                    <p className="mt-1 text-sm">{order.deliveryAddress}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="mb-3 text-sm font-semibold text-slate-500">Products</p>
                  <div className="space-y-2">
                    {order.products?.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"
                      >
                        <p className="font-semibold">
                          {item.product?.name || 'Product'}
                        </p>
                        <p className="text-sm text-slate-600">
                          ₹{Number(item.price).toLocaleString('en-IN')} × {item.quantity}
                        </p>
                      </div>
                    ))}
                  </div>

                  {['Pending', 'Confirmed'].includes(order.orderStatus) && (
                    <button
                      type="button"
                      onClick={() => handleCancel(order._id)}
                      className="mt-4 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderHistory;
