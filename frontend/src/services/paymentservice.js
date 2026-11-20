import API from '../api';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Generate UPI QR code
export const createUPIPayment = async (orderId) => {
  const response = await API.post(
    '/payments/upi/create',
    { orderId },
    authHeaders()
  );
  return response.data;
};

// Submit UPI UTR/reference for manual verification
export const submitUPIPaymentReference = async (orderId, utr) => {
  const response = await API.post(
    '/payments/upi/submit',
    { orderId, utr },
    authHeaders()
  );
  return response.data;
};
