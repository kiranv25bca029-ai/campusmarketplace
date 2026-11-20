import { useState, useEffect } from 'react';
import { getProducts } from './services/productservice';
import { createOrder, cancelOrder } from './services/orderservice';
import {
  createUPIPayment,
  submitUPIPaymentReference
} from './services/paymentservice';
import {
  Search, ShoppingCart, Heart, Menu,
  Laptop, Smartphone, Headphones, Keyboard,
  Gamepad2, Watch, ArrowRight, Star
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom';

const categories = [
  { name: 'Laptops', icon: Laptop },
  { name: 'Mobiles', icon: Smartphone },
  { name: 'Headphones', icon: Headphones },
  { name: 'Keyboards', icon: Keyboard },
  { name: 'Gaming Accessories', icon: Gamepad2 },
  { name: 'Computer Accessories', icon: Watch },
]

function App() {
  const [products, setProducts] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Product loading error:', error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  fetchProducts();
}, []);

  useEffect(() => {
    if (productsLoading) return;

    setCart((current) => {
      if (!Array.isArray(current)) return [];

      return current.flatMap((item) => {
        const product = products.find((candidate) => candidate._id === item.id);
        const quantity = Number(item.quantity);

        if (!product || product.stock < 1 || !Number.isInteger(quantity) || quantity < 1) {
          return [];
        }

        return [{ id: item.id, quantity: Math.min(quantity, product.stock) }];
      });
    });

    setWishlist((current) => {
      if (!Array.isArray(current)) return [];
      const availableIds = new Set(products.map((product) => product._id));
      return current.filter((id) => availableIds.has(id));
    });
  }, [products, productsLoading]);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [priceFilter, setPriceFilter] = useState('All')
    const [cart, setCart] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem('campusmart-cart') || '[]');
      } catch {
        return [];
      }
    })
    const [wishlist, setWishlist] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem('campusmart-wishlist') || '[]');
      } catch {
        return [];
      }
    })
  const [showCart, setShowCart] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [orderConfirmation, setOrderConfirmation] = useState(null);
  const [upiQR, setUpiQR] = useState(null);
    const filteredProducts = products.filter((product) => {
      const matchesSearch = (product.name || '').toLowerCase().includes(search.toLowerCase())
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory

      const price = Number(product.price);
      const matchesPrice =
        priceFilter === 'All' ||
        (priceFilter === 'Under5000' && price < 5000) ||
        (priceFilter === '5000-15000' && price >= 5000 && price <= 15000) ||
        (priceFilter === 'Above15000' && price > 15000);

      return matchesSearch && matchesCategory && matchesPrice
    })

    const toggleWishlist = (id) => {
      setWishlist((current) =>
        current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id]
      )
    }

    useEffect(() => {
      localStorage.setItem('campusmart-cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
      localStorage.setItem('campusmart-wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    useEffect(() => {
      return undefined;
    }, []);

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800">

        {/* Navigation */}
        <header className="bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">

            <h1 className="text-2xl font-bold text-blue-700">
              Campus<span className="text-slate-800">Mart</span>
            </h1>

            <div className="hidden flex-1 items-center rounded-xl bg-slate-100 px-4 py-3 md:flex md:max-w-xl">
              <Search size={20} className="text-slate-500" />
              <input
                type="text"
                placeholder="Search laptops, mobiles and accessories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ml-3 w-full bg-transparent outline-none"
              />
            </div>

            <div className="flex items-center gap-5 max-lg:hidden">
              <button
                type="button"
                className="relative"
                onClick={() => {
                  setShowWishlist((current) => !current);
                  setShowCart(false);
                }}
              >
                <Heart size={23} />
                <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1.5 text-xs text-white">
                  {wishlist.length}
                </span>
              </button>

              <button
                className="relative"
                onClick={() => {
                  setShowCart((current) => !current);
                  setShowWishlist(false);
                }}
              >
                <ShoppingCart size={23} />
                <span className="absolute -right-2 -top-2 rounded-full bg-blue-600 px-1.5 text-xs text-white">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              </button>
<div className="flex items-center gap-2">
  {user && (
    <>
      <Link
        to="/orders"
        className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700"
      >
        My Orders
      </Link>
      <Link
        to="/seller/dashboard"
        className="rounded-lg border border-blue-700 px-3 py-2 font-semibold text-blue-700"
      >
        Dashboard
      </Link>
      {user.role === 'admin' && (
        <Link
          to="/admin/dashboard"
          className="rounded-lg bg-slate-900 px-3 py-2 font-semibold text-white"
        >
          Admin
        </Link>
      )}
    </>
  )}
  <Link
    to="/add-product"
    className="rounded-lg bg-green-600 px-3 py-2 text-white"
  >
    Sell Product
  </Link>
</div>
              {user ? (
    <div className="hidden items-center gap-2 sm:flex">
      <span className="font-semibold text-blue-700">
        Hi, {user.fullName}
      </span>

      <button
        onClick={handleLogout}
        className="rounded-lg bg-red-500 px-3 py-2 text-white"
      >
        Logout
      </button>
    </div>
  ) : (
    <div className="hidden items-center gap-3 sm:flex">
      <Link to="/login" className="font-semibold text-blue-700">
        Login
      </Link>

      <Link
        to="/register"
        className="rounded-lg bg-blue-700 px-3 py-2 text-white"
      >
        Register
      </Link>
    </div>
  )}

              <button
                type="button"
                className="md:hidden"
                onClick={() => setMobileMenuOpen((current) => !current)}
                aria-label="Toggle navigation menu"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex items-center border-b bg-white px-6 py-3 md:hidden">
          <Search size={20} className="text-slate-500" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="ml-3 w-full bg-transparent outline-none"
          />
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="border-t bg-white px-6 py-4 md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-3">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              {user && <Link to="/orders" onClick={() => setMobileMenuOpen(false)}>My Orders</Link>}
              {user && <Link to="/seller/dashboard" onClick={() => setMobileMenuOpen(false)}>Seller Dashboard</Link>}
              {user?.role === 'admin' && <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>Admin Dashboard</Link>}
              <Link to="/add-product" onClick={() => setMobileMenuOpen(false)}>Sell Product</Link>
              {!user && <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Login</Link>}
              {!user && <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Register</Link>}
            </div>
          </nav>
        )}

        {/* Hero Section */}
        {/* Wishlist */}
        {showWishlist && (
          <section className="mx-auto max-w-7xl px-6 py-8">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-2xl font-bold">My Wishlist</h2>

              {wishlist.length === 0 ? (
                <p className="text-slate-500">Your wishlist is empty.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {products
                    .filter((product) => wishlist.includes(product._id))
                    .map((product) => (
                      <div key={product._id} className="flex items-center gap-4 rounded-lg border p-4">
                        <img
                          src={product.image || '/fallback-product.svg'}
                          alt={product.name}
                          className="h-20 w-20 rounded object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-blue-700">
                            ₹{Number(product.price).toLocaleString('en-IN')}
                          </p>
                          <button
                            type="button"
                            onClick={() => setWishlist((current) =>
                              current.filter((id) => id !== product._id)
                            )}
                            className="mt-2 text-sm font-semibold text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Shopping Cart */}
    {showCart && (
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-2xl font-bold">My Shopping Cart</h2>

          {cart.length === 0 ? (
            <p className="text-slate-500">Your cart is empty.</p>
          ) : (
            <>
              {cart.map((item) => {
                const product = products.find(
                  (p) => p._id === item.id
                );

                if (!product) return null;

                return (
                  <div
                    key={item.id}
                    className="mb-4 flex items-center justify-between border-b pb-4"
                  >
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-slate-500">
                        ₹{product.price.toLocaleString('en-IN')} × {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">

  <button
    onClick={() =>
      setCart((current) =>
        current.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: Math.max(1, cartItem.quantity - 1) }
            : cartItem
        )
      )
    }
    className="rounded bg-slate-200 px-3 py-1"
  >
    −
  </button>

  <span className="font-semibold">{item.quantity}</span>

  <button
    onClick={() =>
      setCart((current) =>
        current.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: Math.min(product.stock ?? 1, cartItem.quantity + 1) }
            : cartItem
        )
      )
    }
    className="rounded bg-blue-600 px-3 py-1 text-white"
  >
    +
  </button>

  <span className="font-bold">
    ₹{(product.price * item.quantity).toLocaleString('en-IN')}
  </span>

  <button
    onClick={() =>
      setCart((current) =>
        current.filter((cartItem) => cartItem.id !== item.id)
      )
    }
    className="text-sm font-semibold text-red-600"
  >
    Remove
  </button>

</div>
                  </div>
                );
              })}

              <p className="mt-4 text-right text-xl font-bold">
                Total: ₹
                {cart.reduce((total, item) => {
                  const product = products.find((p) => p._id === item.id);
                  return total + (product ? product.price * item.quantity : 0);
                }, 0).toLocaleString('en-IN')}
              </p>
              <div className="mt-6 flex justify-end">
  <button
    type="button"
    onClick={() => {
setShowCheckout(true);
setShowCart(false);
}}
    className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
  >
    Proceed to Checkout
  </button>
</div>
            </>
          )}
        </div>
      </section>
    )}
{showCheckout && (
  <section className="mx-auto max-w-3xl px-6 py-10">
    <div className="rounded-xl border bg-white p-6 shadow">
      <h2 className="mb-6 text-2xl font-bold">
        Checkout Details
      </h2>

      <form
      onSubmit={async (e) => {
  e.preventDefault();

  try {
        if (!cart.length || cart.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1)) {
          alert('Your cart is empty or contains invalid quantities.');
          setShowCheckout(false);
          setShowCart(true);
          return;
        }

    const formData = new FormData(e.currentTarget);

    const orderData = {
      customerName: formData.get('customerName'),
      mobileNumber: formData.get('mobileNumber'),
      deliveryAddress: formData.get('deliveryAddress'),
      paymentMethod,
      upiId: '',
      transactionId: '',
      products: cart.map((item) => ({
        product: item.id,
        quantity: item.quantity
      }))
    };

    const response = await createOrder(orderData);

    if (paymentMethod === 'UPI') {
      const qrResponse = await createUPIPayment(response.order._id);
      setUpiQR({
        ...qrResponse,
        order: response.order
      });
      setCart([]);
      setShowCheckout(false);

      return;
    }

    setOrderConfirmation(response.order);
    setCart([]);
    setShowCheckout(false);
    alert(response.message);

  } catch (error) {
    alert(
      error.response?.data?.message || 'Order placement failed!'
    );
  }
}}
      >
        <input
          type="text"
          name="customerName"
          placeholder="Customer Name"
          required
          className="w-full rounded-lg border p-3"
        />

        <input
          type="tel"
          name="mobileNumber"
          placeholder="Mobile Number"
          pattern="[0-9]{10}"
          required
          className="w-full rounded-lg border p-3"
        />

        <textarea
          name="deliveryAddress"
          placeholder="Delivery Address"
          required
          className="w-full rounded-lg border p-3"
          rows="4"
        />

        <div>
          <label className="mb-2 block text-sm font-medium">
            Payment Method
          </label>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-lg border bg-slate-100 p-3 text-sm"
          >
            <option value="Cash on Delivery">Cash on Delivery</option>
            <option value="UPI">UPI</option>
          </select>
        </div>

        {paymentMethod === 'UPI' && (
  <p className="text-sm text-slate-600">
    A UPI QR code will be generated after you place your order.
    Scan it using Google Pay, PhonePe or Paytm.
  </p>
)}

        <button
          type="submit"
          className="w-full rounded-lg bg-green-600 p-3 font-semibold text-white hover:bg-green-700"
        >
          Place Order
        </button>
      </form>
      {upiQR && (
  <div className="mt-6 rounded-xl border bg-slate-50 p-6 text-center">
    <h3 className="text-xl font-bold text-green-700">
      Scan to Pay
    </h3>

    <p className="mt-2 text-slate-600">
      Amount: ₹{Number(upiQR.amount).toLocaleString('en-IN')}
    </p>

    <img
      src={upiQR.qrCode}
      alt="CampusMart UPI Payment QR Code"
      className="mx-auto mt-4 h-64 w-64 rounded-lg border bg-white p-2"
    />

    <p className="mt-3 text-sm text-slate-600">
      Scan using Google Pay, PhonePe or Paytm.
    </p>

    <a
      href={upiQR.upiUrl}
      className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white"
    >
      Open UPI App
    </a>

    <p className="mt-3 text-sm font-semibold text-orange-600">
      Payment Status: Pending Verification
    </p>

    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const utr = new FormData(event.currentTarget).get('utr')?.toString().trim();

        if (!utr) {
          alert('Enter the UPI UTR/transaction reference.');
          return;
        }

        try {
          const result = await submitUPIPaymentReference(upiQR.order._id, utr);
          alert(result.message);
        } catch (error) {
          alert(error.response?.data?.message || 'Unable to submit UPI reference');
        }
      }}
      className="mx-auto mt-5 max-w-md"
    >
      <label className="mb-2 block text-left text-sm font-semibold text-slate-600">
        UPI UTR / Transaction Reference
      </label>
      <input
        name="utr"
        required
        minLength={6}
        maxLength={35}
        pattern="[A-Za-z0-9]+"
        placeholder="Enter UTR after payment"
        className="w-full rounded-lg border p-3"
      />
      <button
        type="submit"
        className="mt-3 w-full rounded-lg bg-green-600 px-5 py-3 font-semibold text-white"
      >
        Submit Payment Reference
      </button>
    </form>
  </div>
)}
    </div>
  </section>
)}
{orderConfirmation && (
          <section className="mx-auto max-w-3xl px-6 py-10">
            <div className="rounded-xl border border-green-200 bg-white p-8 text-center shadow">
              <h2 className="mb-3 text-3xl font-bold text-green-700">
                Order Confirmed!
              </h2>
              <p className="text-slate-600">
                Order ID: {orderConfirmation._id}
              </p>
              <p className="mt-2 font-semibold">
                Total: ₹{Number(orderConfirmation.totalAmount).toLocaleString('en-IN')}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Payment: {orderConfirmation.paymentMethod} — {orderConfirmation.paymentStatus}
              </p>
              <button
                type="button"
                onClick={() => setOrderConfirmation(null)}
                className="mt-6 rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white"
              >
                Continue Shopping
              </button>
            </div>
          </section>
        )}
        {/* Hero Section */}
        <section className="bg-blue-700 px-6 py-16 text-white">
          <div className="mx-auto max-w-7xl">
            <p className="mb-3 font-medium text-blue-200">
              YOUR CAMPUS SHOPPING DESTINATION
            </p>

            <h2 className="max-w-2xl text-4xl font-bold md:text-5xl">
              Buy and Sell Electronics Easily!
            </h2>

            <p className="mt-5 max-w-xl text-blue-100">
              Discover laptops, mobiles and accessories at great prices.
              Shop conveniently through your campus marketplace.
            </p>

            <button
              type="button"
              onClick={() => document.querySelector('#featured-products')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-7 flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 hover:bg-blue-50"
            >
              Explore Products <ArrowRight size={18} />
            </button>
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-7xl px-6 py-12">
          <h2 className="mb-7 text-2xl font-bold">Shop by Category</h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {categories.map((category) => {
              const Icon = category.icon

              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`rounded-xl border p-5 transition hover:border-blue-500 hover:bg-blue-50 ${
                    selectedCategory === category.name
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <Icon className="mx-auto mb-3 text-blue-600" size={30} />
                  <p className="text-sm font-semibold">{category.name}</p>
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setSelectedCategory('All')}
            className="mt-4 text-sm font-semibold text-blue-700"
          >
            Show all categories
          </button>
        </section>

        {/* Products */}
        <section className="mx-auto max-w-7xl px-6 pb-16" id="featured-products">
          <div className="mb-7 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Featured Products</h2>
              <p className="mt-1 text-sm text-slate-500">
                Find great deals on electronics
              </p>
            </div>

            <select
              value={priceFilter}
              onChange={(event) => setPriceFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm"
              aria-label="Filter products by price"
            >
              <option value="All">All Prices</option>
              <option value="Under5000">Under ₹5,000</option>
              <option value="5000-15000">₹5,000 – ₹15,000</option>
              <option value="Above15000">Above ₹15,000</option>
            </select>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="h-48 w-full rounded bg-slate-100" />

                  <div className="mt-4">
                    <div className="h-4 rounded bg-slate-100" />
                    <div className="mt-2 h-4 rounded bg-slate-100" />
                    <div className="mt-2 h-4 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative">
                    <img
                      src={product.image || '/fallback-product.svg'}
                      alt={product.name}
                      className="h-48 w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = '/fallback-product.svg';
                      }}
                    />

                    <button
                      onClick={() => toggleWishlist(product._id)}
                      className="absolute right-3 top-3 rounded-full bg-white p-2 shadow"
                    >
                      <Heart
                        size={20}
                        className={
                          wishlist.includes(product._id)
                            ? 'fill-red-500 text-red-500'
                            : 'text-slate-600'
                        }
                      />
                    </button>
                  </div>

                  <div className="p-4">
                    <p className="text-xs font-medium text-blue-600">
                      {product.category}
                    </p>

                    <Link
                      to={`/products/${product._id}`}
                      className="mt-2 block font-semibold hover:text-sky-400"
                    >
                      {product.name}
                    </Link>

                    <p className="mt-2 text-sm text-slate-500">
                      Condition: {product.condition}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </p>

                    <div className="mt-3 flex items-center gap-1 text-yellow-500">
                      <Star size={15} fill="currentColor" />
                      <Star size={15} fill="currentColor" />
                      <Star size={15} fill="currentColor" />
                      <Star size={15} fill="currentColor" />
                      <Star size={15} />
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xl font-bold text-slate-900">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>

                      <button
  disabled={!product.stock}
  type="button"
  className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
  onClick={() => {
    setCart((current) => {
      const existing = current.find(
        (item) => item.id === product._id
      );

      if (existing) {
        return current.map((item) =>
          item.id === product._id
            ? { ...item, quantity: Math.min(product.stock, item.quantity + 1) }
            : item
        );
      }

      return [
        ...current,
        { id: product._id, quantity: 1 }
      ];
    });

    setShowCart(true);
  }}
>
  Add to Cart
</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredProducts.length === 0 && !productsLoading && (
            <p className="py-12 text-center text-slate-500">
              No products found.
            </p>
          )}
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 px-6 py-8 text-center text-white">
          <h2 className="text-xl font-bold">CampusMart</h2>
          <p className="mt-2 text-sm text-slate-400">
            Your Campus Shopping Destination
          </p>
          <p className="mt-4 text-xs text-slate-500">
            © 2026 CampusMart. All rights reserved.
          </p>
        </footer>

      </div>
    )
  }

  export default App