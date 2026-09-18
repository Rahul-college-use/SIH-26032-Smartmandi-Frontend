import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import BookSlot from './pages/BookSlot';
import MyBookings from './pages/MyBookings';
import AdminDashboard from './pages/AdminDashboard';
import FarmerDashboard from './pages/FarmerDashboard';
import HomePage from './pages/HomePage.jsx';
import GateScannerPage from './pages/GateScannerPage';
import priceTrendWidget from './pages/PriceTrendWidget.jsx';

import { 
  Sparkles, 
  LogOut, 
  QrCode, 
  Calendar, 
  Clock, 
  LayoutDashboard, 
  Menu, 
  X 
} from 'lucide-react';
import Prototype from './Pototype.jsx';
import VoiceAssistant from './components/VoiceAssistant.jsx';

function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const closeMenu = () => setMobileMenuOpen(false);

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
      isActive
        ? 'bg-emerald-50 text-emerald-700 font-bold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2 group shrink-0">
          <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-xs group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-lg font-black text-slate-900 tracking-tight">
            Smart<span className="text-emerald-600">Mandi</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-3">
          {user.role === 'farmer' && (
            <>
              <NavLink to="/dashboard" className={navItemClass}>
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/book" className={navItemClass}>
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Book Slot</span>
              </NavLink>
              <NavLink to="/my-bookings" className={navItemClass}>
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>My Bookings</span>
              </NavLink>
            </>
          )}

          {(user.role === 'admin' || user.role === 'operator') && (
            <>
              <NavLink to="/admin" className={navItemClass}>
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                <span>Console</span>
              </NavLink>
              <NavLink
                to="/gate-scanner"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs shadow-emerald-200 transition-all"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Gate Scanner</span>
              </NavLink>
            </>
          )}

          {/* User Profile Pill & Logout Button */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-800 leading-tight max-w-[120px] truncate">
                {user.name || 'Farmer'}
              </span>
              <span className="text-[10px] uppercase font-semibold text-emerald-700 tracking-wide">
                {user.role}
              </span>
            </div>

            <button
              onClick={logout}
              title="Logout from account"
              className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">{user.name || 'Farmer'}</span>
              <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">{user.role}</span>
            </div>
            <button
              onClick={() => { closeMenu(); logout(); }}
              className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>

          <nav className="flex flex-col gap-1 pt-1">
            {user.role === 'farmer' && (
              <>
                <NavLink to="/dashboard" onClick={closeMenu} className={navItemClass}>
                  <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink to="/book" onClick={closeMenu} className={navItemClass}>
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Book Slot</span>
                </NavLink>
                <NavLink to="/my-bookings" onClick={closeMenu} className={navItemClass}>
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>My Bookings</span>
                </NavLink>
              </>
            )}

            {(user.role === 'admin' || user.role === 'operator') && (
              <>
                <NavLink to="/admin" onClick={closeMenu} className={navItemClass}>
                  <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                  <span>Console</span>
                </NavLink>
                <NavLink
                  to="/gate-scanner"
                  onClick={closeMenu}
                  className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl bg-emerald-600 text-white"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Gate Scanner</span>
                </NavLink>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to={user.role === 'farmer' ? '/dashboard' : '/admin'} replace />;
    }
  }

  return children;
}

function HomeRouteWrapper() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to={user.role === 'admin' || user.role === 'operator' ? '/admin' : '/dashboard'} replace />;
  }

  return (
    <HomePage
      onLogin={() => navigate('/login')}
      onGetStarted={() => navigate('/register')}
    />
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomeRouteWrapper />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Farmer Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="farmer">
              <FarmerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book"
          element={
            <ProtectedRoute role="farmer">
              <BookSlot />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute role="farmer">
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* Admin & Mandi Console Protected Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role={['admin', 'operator']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Gate Entry QR Camera Scanner */}
        <Route
          path="/gate-scanner"
          element={
            <ProtectedRoute role={['admin', 'operator']}>
              <GateScannerPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback Catch-All Route */}
        <Route
          path="*"
          element={
            <Navigate
              to={
                user
                  ? user.role === 'admin' || user.role === 'operator'
                    ? '/admin'
                    : '/dashboard'
                  : '/login'
              }
              replace
            />
          }
        />
        <Route path="/prototype" element={<Prototype />} />
      </Routes>
      {user && user.role === 'farmer' && <VoiceAssistant />}
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}