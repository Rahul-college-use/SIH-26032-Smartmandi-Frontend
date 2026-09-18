import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  LogIn, 
  Eye, 
  EyeOff, 
  Lock, 
  Phone, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login } = useAuth();

  // Pre-fill phone if coming from Register screen
  const [form, setForm] = useState({
    phone: location.state?.registeredPhone || '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Agar user already logged-in hai toh login screen bypass karke seedhe dashboard bhejein
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'operator' || user.role === 'centre') {
        navigate('/gate-scanner', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Mobile number me sirf digits allow karein
    if (name === 'phone') {
      const sanitized = value.replace(/\D/g, '').slice(0, 10);
      setForm((prev) => ({ ...prev, phone: sanitized }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Strict 10-digit check
    if (form.phone.length !== 10) {
      setError('Kripya 10-digit ka valid mobile number darj karein.');
      return;
    }

    if (!form.password) {
      setError('Kripya password darj karein.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        phone: form.phone,
        password: form.password
      });

      const { token, user: loggedInUser } = res.data;
      login(token, loggedInUser);

      // Exact Role-Based Routing
      if (loggedInUser.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (loggedInUser.role === 'operator' || loggedInUser.role === 'centre') {
        navigate('/gate-scanner', { replace: true });
      } else {
        // Farmer Dashboard Route
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Login fail ho gaya. Mobile number ya password sahi se check karein.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      
      {/* Top Header & Brand */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Home
        </button>
        <span className="text-lg font-black tracking-tight text-slate-900">
          Smart<span className="text-emerald-600">Mandi</span>
        </span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-3 shadow-inner">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back!</h2>
          <p className="text-xs text-slate-500 mt-1">Apne account mein login karke token aur mandi status check karein</p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2 font-medium animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Mobile Number Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                name="phone"
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={handleChange}
                maxLength={10}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <Link 
                to="/forgot-password" 
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button with Loading Spinner */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <span>Login to SmartMandi</span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
          Naye kisan hain?{' '}
          <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-700 ml-1">
            Register as Farmer
          </Link>
        </div>
      </div>

    </div>
  );
}