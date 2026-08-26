import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || '';
    if (API_URL) {
      axios.defaults.baseURL = API_URL;
    }
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchMe = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Error fetching user', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
    const res = await axios.post('/api/auth/login', { phone, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
    setIsAuthenticated(true);
    return userData;
  };

  const register = async (userData) => {
    const res = await axios.post('/api/auth/register', userData);
    const { token, user: newUser } = res.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(newUser);
    setIsAuthenticated(true);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['Authorization'];
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
