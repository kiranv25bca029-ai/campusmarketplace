import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import API from '../api';

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await API.post('/auth/login', {
        email: formData.email.trim(),
        password: formData.password
      });
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user || {}));

        setStatus({ type: 'success', message: 'Login successful! Redirecting...' });
        
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Login failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2">
        
        {/* Left Side - Branding */}
        <div className="hidden md:flex bg-blue-700 text-white p-12 flex-col justify-center">
          <div className="flex items-center gap-3 mb-12">
            <ShoppingBag size={38} />
            <h1 className="text-3xl font-bold">CampusMart</h1>
          </div>
          <h2 className="text-4xl font-bold mb-5">Welcome to CampusMart!</h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            Your campus marketplace for buying and selling electronics, gadgets and accessories.
          </p>
          <div className="mt-10 border-t border-blue-500 pt-6">
            <p className="text-sm text-blue-100 italic">Buy Smart. Sell Easy. Shop CampusMart.</p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="p-8 md:p-14 flex flex-col justify-center">
          <div className="md:hidden flex items-center gap-2 mb-8 text-blue-700">
            <ShoppingBag size={28} />
            <span className="text-xl font-bold">CampusMart</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-500 mb-8">Please enter your details to sign in.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg px-4 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                <Mail size={19} className="text-gray-400" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="name@university.edu"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full p-3 outline-none bg-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg px-4 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                <Lock size={19} className="text-gray-400" />
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full p-3 outline-none bg-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 text-white p-3 rounded-lg font-semibold hover:bg-blue-800 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:transform active:scale-[0.98]"
            >
              {loading ? 'Signing in...' : 'Login'}
              {!loading && <ArrowRight size={19} />}
            </button>
          </form>

          {status.message && (
            <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 text-sm ${
              status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {status.message}
            </div>
          )}

          <div className="text-center mt-8 text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-blue-700 hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;