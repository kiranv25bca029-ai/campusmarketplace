import { useState } from 'react';
import API from '../api';
import {
  ShoppingBag,
  User,
  Mail,
  Lock,
  Phone
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fullName = formData.fullName.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();

    if (!fullName || !email || !phone || !formData.password) {
      setMessage('Please fill in all fields');
      return;
    }

    if (formData.password.length < 6) {
      setMessage('Password must contain at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setMessage('Mobile number must contain 10 digits');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await API.post(
        '/auth/register',
        {
          fullName,
          email,
          phone,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        }
      );

      setMessage(
        response.data.message || 'Registration successful!'
      );

      setFormData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      });

      setTimeout(() => {
        navigate('/login');
      }, 1000);

    } catch (error) {
      console.log(
        'Registration Error:',
        error.response?.data || error.message
      );

      setMessage(
        error.response?.data?.message || 'Registration failed!'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">

      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2">

        {/* LEFT SIDE */}

        <div className="bg-blue-700 text-white p-10 md:p-12 flex flex-col justify-center">

          <div className="flex items-center gap-3 mb-12">
            <ShoppingBag size={38} />

            <h1 className="text-3xl font-bold">
              CampusMart
            </h1>
          </div>

          <h2 className="text-4xl font-bold mb-5">
            Join Our Campus Community!
          </h2>

          <p className="text-blue-100 text-lg leading-relaxed">
            Create your account and discover a smarter way
            to buy and sell electronics, gadgets and accessories.
          </p>

          <div className="mt-10 border-t border-blue-500 pt-6">
            <p className="text-sm text-blue-100">
              Buy Smart. Sell Easy. Shop CampusMart.
            </p>
          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="p-8 md:p-12 flex flex-col justify-center">

          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Create Account
          </h2>

          <p className="text-gray-500 mb-7">
            Enter your details to get started.
          </p>

          <form onSubmit={handleSubmit}>

            {/* FULL NAME */}

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </label>

            <div className="flex items-center border border-gray-300 rounded-lg px-4 mb-4">
              <User size={19} className="text-gray-400" />

              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full p-3 outline-none"
              />
            </div>

            {/* EMAIL */}

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>

            <div className="flex items-center border border-gray-300 rounded-lg px-4 mb-4">
              <Mail size={19} className="text-gray-400" />

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-3 outline-none"
              />
            </div>

            {/* PHONE */}

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mobile Number
            </label>

            <div className="flex items-center border border-gray-300 rounded-lg px-4 mb-4">
              <Phone size={19} className="text-gray-400" />

              <input
                type="tel"
                name="phone"
                placeholder="Enter your mobile number"
                value={formData.phone}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                className="w-full p-3 outline-none"
              />
            </div>

            {/* PASSWORD */}

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>

            <div className="flex items-center border border-gray-300 rounded-lg px-4 mb-4">
              <Lock size={19} className="text-gray-400" />

              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full p-3 outline-none"
              />
            </div>

            {/* CONFIRM PASSWORD */}

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm Password
            </label>

            <div className="flex items-center border border-gray-300 rounded-lg px-4 mb-6">
              <Lock size={19} className="text-gray-400" />

              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full p-3 outline-none"
              />
            </div>

            {/* REGISTER BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 text-white p-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-60"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

          </form>

          {/* MESSAGE */}

          {message && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${
                message.includes('successful')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {message}
            </div>
          )}

          <div className="text-center mt-6 text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-700 hover:underline">
              Sign in
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Register;