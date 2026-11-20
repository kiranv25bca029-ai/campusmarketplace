import API from '../api';

export const createOrder = async (orderData) => {
  const token = localStorage.getItem('token');

  const response = await API.post('/orders', orderData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
};

export const getMyOrders = async () => {
  const token = localStorage.getItem('token');
  const response = await API.get('/orders/my', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const cancelOrder = async (orderId) => {
  const token = localStorage.getItem('token');
  const response = await API.patch(`/orders/${orderId}/cancel`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};