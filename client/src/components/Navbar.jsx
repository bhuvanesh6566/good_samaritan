import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, AlertCircle, Heart, MapPin, Menu, X, LogOut, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isEmergency = location.pathname === '/emergency';

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className={`${isEmergency ? 'bg-gray-900 border-b border-gray-800' : 'bg-white shadow-sm border-b border-gray-100'} sticky top-0 z-50 transition-colors`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 focus:outline-none">
              <span className="text-xl sm:text-2xl font-black tracking-tight">
                <span className={isEmergency ? 'text-white' : 'text-red-600'}>🚨 RescueLink</span>
                <span className={isEmergency ? 'text-red-500 ml-1' : 'text-gray-900 ml-1 font-bold'}>AI</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded-xl text-sm font-bold transition ${
                location.pathname === '/'
                  ? isEmergency ? 'bg-gray-800 text-white' : 'bg-red-50 text-red-600'
                  : isEmergency ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-red-600'
              }`}
            >
              Home
            </Link>

            <Link
              to="/emergency"
              className="px-4 py-2 rounded-xl text-sm font-black flex items-center gap-1.5 bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/20 transition animate-pulse"
            >
              <AlertCircle size={16} /> Emergency
            </Link>

            <Link
              to="/first-aid"
              className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition ${
                location.pathname === '/first-aid'
                  ? isEmergency ? 'bg-gray-800 text-white' : 'bg-red-50 text-red-600'
                  : isEmergency ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-red-600'
              }`}
            >
              <Heart size={16} /> First Aid
            </Link>

            <Link
              to="/shield"
              className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition ${
                location.pathname === '/shield'
                  ? isEmergency ? 'bg-gray-800 text-white' : 'bg-red-50 text-red-600'
                  : isEmergency ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-red-600'
              }`}
            >
              <Shield size={16} /> Legal Shield
            </Link>

            {user?.role === 'volunteer' && (
              <Link
                to="/volunteer"
                className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition ${
                  location.pathname === '/volunteer'
                    ? isEmergency ? 'bg-gray-800 text-white' : 'bg-orange-50 text-orange-600'
                    : isEmergency ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:bg-orange-50'
                }`}
              >
                <MapPin size={16} /> Responder Hub
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-300/40">
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isEmergency ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
                  {user?.name?.split(' ')[0]}
                </span>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className={`p-2 rounded-xl transition ${isEmergency ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'}`}
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  to="/login"
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold transition border ${
                    isEmergency ? 'border-gray-700 text-white hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow transition"
                >
                  Join
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Actions (Call 112 + Hamburger) */}
          <div className="md:hidden flex items-center gap-2">
            <a
              href="tel:112"
              className="bg-red-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 shadow"
            >
              <Phone size={12} /> 112
            </a>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2.5 rounded-xl transition ${isEmergency ? 'text-white hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-100'}`}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className={`md:hidden ${isEmergency ? 'bg-gray-900 border-t border-gray-800 text-white' : 'bg-white border-t border-gray-100 shadow-xl'}`}>
          <div className="px-4 pt-3 pb-6 space-y-2">
            <Link
              to="/emergency"
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-base font-black bg-red-600 text-white shadow-lg shadow-red-600/30"
            >
              <AlertCircle size={20} /> 🚨 REPORT EMERGENCY
            </Link>

            <Link
              to="/"
              className={`block px-4 py-3 rounded-xl text-base font-bold transition ${
                location.pathname === '/' ? 'bg-red-50 text-red-600' : isEmergency ? 'text-gray-200' : 'text-gray-700'
              }`}
            >
              Home
            </Link>

            <Link
              to="/first-aid"
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-base font-bold transition ${
                location.pathname === '/first-aid' ? 'bg-red-50 text-red-600' : isEmergency ? 'text-gray-200' : 'text-gray-700'
              }`}
            >
              <Heart size={18} className="text-red-500" /> Offline First Aid
            </Link>

            <Link
              to="/shield"
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-base font-bold transition ${
                location.pathname === '/shield' ? 'bg-green-50 text-green-700' : isEmergency ? 'text-gray-200' : 'text-gray-700'
              }`}
            >
              <Shield size={18} className="text-green-500" /> Good Samaritan Shield
            </Link>

            {user?.role === 'volunteer' && (
              <Link
                to="/volunteer"
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-base font-bold transition ${
                  location.pathname === '/volunteer' ? 'bg-orange-50 text-orange-600' : isEmergency ? 'text-orange-400' : 'text-orange-600'
                }`}
              >
                <MapPin size={18} className="text-orange-500" /> Responder Hub
              </Link>
            )}

            <div className="pt-3 mt-3 border-t border-gray-200/40">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="px-4 py-1 text-xs text-gray-400 font-medium">
                    Signed in as <strong className="text-gray-200">{user?.name}</strong> ({user?.role})
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    to="/login"
                    className="text-center py-3 rounded-xl font-bold text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-center py-3 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 transition shadow"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
