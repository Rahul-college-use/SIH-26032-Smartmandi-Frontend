import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  UserPlus,
  Eye,
  EyeOff,
  User,
  Phone,
  CreditCard,
  MapPin,
  Lock,
  RefreshCw,
  AlertCircle,
  Wheat,
  Truck,
  Layers,
  Building2,
  CheckCircle2
} from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    aadhaar: '',
    district: '',
    acres: '',
    primaryCrop: 'Wheat',
    vehicleNumber: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    password: '',
    confirmPassword: ''
  });
  const [bankAutoFetched, setBankAutoFetched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setForm((prev) => ({ ...prev, phone: digits }));
    } else if (name === 'aadhaar') {
      const rawDigits = value.replace(/\D/g, '').slice(0, 12);
      const formatted = rawDigits.match(/.{1,4}/g)?.join(' ') || rawDigits;
      setForm((prev) => ({ ...prev, aadhaar: formatted }));
    } else if (name === 'vehicleNumber') {
      setForm((prev) => ({ ...prev, vehicleNumber: value.toUpperCase() }));
    } else if (name === 'ifscCode') {
      setForm((prev) => ({ ...prev, ifscCode: value.toUpperCase().slice(0, 11) }));
    } else if (name === 'accountNumber') {
      const digits = value.replace(/\D/g, '').slice(0, 18);
      setForm((prev) => ({ ...prev, accountNumber: digits }));
    }
    else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    if (error) setError('');
  };

  // 1-Click NPCI / DBT Bank Account Auto-Fetch Simulation
  const handleFetchBankViaKYC = () => {
    const cleanedAadhaar = form.aadhaar.replace(/\D/g, '');
    if (cleanedAadhaar.length !== 12) {
      setError('Pehle 12-digit National ID enter karein taaki DBT khata fetch ho sake.');
      return;
    }

    // Auto-resolve linked DBT bank details
    setForm((prev) => ({
      ...prev,
      bankName: 'State Bank of India',
      accountNumber: '38920194821',
      ifscCode: 'SBIN0001234'
    }));
    setBankAutoFetched(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanedPhone = form.phone.replace(/\D/g, '');
    const cleanedAadhaar = form.aadhaar.replace(/\D/g, '');

    // Validations
    if (cleanedPhone.length !== 10) {
      setError('Kripya 10-digit ka valid mobile number darj karein.');
      return;
    }

    if (cleanedAadhaar.length !== 12) {
      setError('ID theek 12 digits ka hona chahiye.');
      return;
    }

    if (!form.acres || Number(form.acres) <= 0) {
      setError('Kripya valid zameen (Acres) darj karein.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password kam se kam 6 characters ka hona chahiye.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords match nahi kar rahe hain.');
      return;
    }

    setLoading(true);

    try {
      const acresCount = Number(form.acres);
      const calculatedQuota = acresCount * 20;

      const res = await api.post('/auth/register', {
        name: form.name.trim(),
        phone: cleanedPhone,
        aadhaar: cleanedAadhaar,
        district: form.district.trim(),
        landDetails: {
          acres: acresCount
        },
        allocatedQuotaQuintal: calculatedQuota,
        primaryCrop: form.primaryCrop,
        vehicleNumber: form.vehicleNumber.trim() || undefined,
        bankDetails: {
          accountNumber: form.accountNumber.trim() || undefined,
          ifscCode: form.ifscCode.trim() || undefined,
          bankName: form.bankName.trim() || undefined
        },
        password: form.password,
        role: 'farmer'
      });

      if (res.data?.token && res.data?.user) {
        login(res.data.token, res.data.user);
        navigate('/book', { replace: true });
      } else {
        navigate('/login', { state: { registeredPhone: cleanedPhone }, replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Registration fail ho gaya. Kripya check karein ki mobile number pehle se registered toh nahi hai.'
      );
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = form.confirmPassword ? form.password === form.confirmPassword : true;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-10 selection:bg-emerald-100 selection:text-emerald-900 font-sans">

      {/* Top Bar */}
      <div className="w-full max-w-xl mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Home
        </button>
        <span className="text-lg font-black tracking-tight text-slate-900">
          Smart<span className="text-emerald-600">Mandi</span>
        </span>
      </div>

      {/* Main Registration Card */}
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-3 shadow-inner">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Farmer Account</h2>
          <p className="text-xs text-slate-500 mt-1">Smart Mandi procurement aur direct MSP DBT ke liye register karein</p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2 font-medium animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Row 1: Full Name & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name (Kisan Ka Naam)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile (SMS & WhatsApp Alert)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Row 2: 12-digit ID & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                12-digit National ID (Verification)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="aadhaar"
                  maxLength={14}
                  placeholder="XXXX XXXX XXXX"
                  value={form.aadhaar}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-semibold tracking-wider focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                District / Zila
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="district"
                  placeholder="e.g. Bhopal, Patna, Sehore"
                  value={form.district}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Land (Acres), Primary Crop, & Tractor Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Land (Acres)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Layers className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  name="acres"
                  step="0.5"
                  min="0.5"
                  placeholder="e.g. 5"
                  value={form.acres}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Primary Crop
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Wheat className="w-4 h-4" />
                </div>
                <select
                  name="primaryCrop"
                  value={form.primaryCrop}
                  onChange={handleChange}
                  className="w-full pl-9 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                >
                  <option value="Wheat">Wheat (Gehu)</option>
                  <option value="Paddy">Paddy (Dhan)</option>
                  <option value="Mustard">Mustard (Sarson)</option>
                  <option value="Chana">Chana (Gram)</option>
                  <option value="Soybean">Soybean</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tractor Plate No.
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Truck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="vehicleNumber"
                  placeholder="MP04AB1234"
                  value={form.vehicleNumber}
                  onChange={handleChange}
                  className="w-full pl-9 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Direct Benefit Transfer (DBT) Bank Details */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>DBT Bank Account Details</span>
              </label>
              <button
                type="button"
                onClick={handleFetchBankViaKYC}
                className="text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Fetch via ID KYC 🔄
              </button>
            </div>

            {bankAutoFetched ? (
              <div className="p-3 bg-emerald-50/80 border border-emerald-300 rounded-xl text-xs space-y-1 animate-fadeIn">
                <div className="text-emerald-900 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Linked DBT Bank: {form.bankName}</span>
                </div>
                <div className="text-slate-600 font-mono text-[11px]">
                  A/C: *******{form.accountNumber.slice(-4)} | IFSC: {form.ifscCode}
                </div>
                <span className="text-[10px] text-emerald-700 block">
                  Public Financial Management System (PFMS) Verified
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="tel"
                  name="accountNumber"
                  placeholder="Bank Account Number"
                  value={form.accountNumber}
                  maxLength={18}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  name="ifscCode"
                  placeholder="IFSC Code (e.g. SBIN0001234)"
                  value={form.ifscCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Row 5: Password and Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Min 6 chars"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Confirm Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 transition-all ${!passwordsMatch ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-emerald-500'
                    }`}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Account Banaya Ja Raha Hai...</span>
              </>
            ) : (
              <span>Register as Farmer</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
          Pehle se account hai?{' '}
          <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-700 ml-1">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}