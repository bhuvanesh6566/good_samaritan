import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Emergency from './pages/Emergency';
import VolunteerDashboard from './pages/VolunteerDashboard';
import GoodSamaritanShield from './pages/GoodSamaritanShield';
import OfflineFirstAid from './pages/OfflineFirstAid';
import Register from './pages/Register';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children, role }) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (role && user?.role !== role) return <Navigate to="/" />;
  
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/shield" element={<GoodSamaritanShield />} />
          <Route path="/first-aid" element={<OfflineFirstAid />} />
          <Route path="/emergency" element={
            <ProtectedRoute>
              <Emergency />
            </ProtectedRoute>
          } />
          <Route path="/volunteer" element={
            <ProtectedRoute role="volunteer">
              <VolunteerDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}
