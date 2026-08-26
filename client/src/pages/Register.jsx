import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Lock, ShieldCheck, MapPin, AlertTriangle, ArrowRight } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'citizen',
    lat: null,
    lng: null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setFormData(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude })),
        err => console.log('Location access note:', err.message),
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const user = await register(formData);
      if (user.role === 'volunteer') navigate('/volunteer');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Registration failed. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12 bg-gray-50">
      <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 text-red-600 rounded-2xl mb-3 shadow-sm">
            <span className="text-2xl">🚨</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Join RescueLink</h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Create an account to report or respond</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3.5 rounded-2xl mb-5 text-xs sm:text-sm font-medium border border-red-200 flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector */}
          <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'citizen' })}
              className={`flex-1 py-3 rounded-xl font-black text-xs sm:text-sm transition-all ${
                formData.role === 'citizen' ? 'bg-white shadow text-gray-900 scale-[1.02]' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Citizen Reporter
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'volunteer' })}
              className={`flex-1 py-3 rounded-xl font-black text-xs sm:text-sm transition-all ${
                formData.role === 'volunteer' ? 'bg-orange-500 shadow text-white scale-[1.02]' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Volunteer Rescuer
            </button>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <User size={18} />
              </div>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:bg-white text-sm transition-all outline-none"
                placeholder="E.g., Bhuvanesh"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Phone size={18} />
              </div>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:bg-white text-sm transition-all outline-none"
                placeholder="10-digit mobile number"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:bg-white text-sm transition-all outline-none"
                placeholder="At least 6 characters"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <ShieldCheck size={18} />
              </div>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:bg-white text-sm transition-all outline-none"
                placeholder="Repeat password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-black py-3.5 rounded-2xl transition shadow-lg mt-5 text-base flex items-center justify-center gap-2 ${
              formData.role === 'volunteer'
                ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/30'
                : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 text-xs sm:text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-red-600 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
