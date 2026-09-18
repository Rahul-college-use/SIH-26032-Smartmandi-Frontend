import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  Users,
  Activity,
  Bell,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  QrCode,
  Calendar,
  Scale,
  MapPin,
  RefreshCw,
  Cpu,
  DollarSign,
  PhoneCall
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PriceTrendWidget from './PriceTrendWidget';
import Footer from '../components/Footer';
import CardHomeLogin from '../components/CardHomeLogin';
import FeatureCard from '../components/FeatureCard';
import Workcard from '../components/Workcard';

export default function HomePage({ onGetStarted, onLogin }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Real Data States (Direct from MongoDB)
  const [realData, setRealData] = useState({
    totalFarmers: 0,
    totalMT: '0.0 MT',
    formattedDBT: '₹0',
    activeInYard: 0,
    avgTurnaround: 25,
    centers: []
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // AI Predictor States
  const [aiForm, setAiForm] = useState({
    Crop_Name: 'Wheat',
    Year: 2026,
    Production_Cost: 950,
    'DemandSupply': 'High',
    Domestic_Market_Price: 1900,
    Inflation_Rate: 5.5
  });
  const [predictedPrice, setPredictedPrice] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const isAdminOrOperator = user?.role === 'admin' || user?.role === 'operator';

  // Role-based Dashboard Navigation
  const handleDashboardRedirect = () => {
    if (isAdminOrOperator) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  // Fetch Real Database Data
  const loadRealDatabaseStats = async () => {
    try {
      setLoadingMetrics(true);
      const response = await fetch('/api/analytics/public-pulse');
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          setRealData(json.data);
        }
      }
    } catch (err) {
      console.warn('Real metrics fetch error:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    loadRealDatabaseStats();
  }, []);

  const handlePredictPrice = async (e) => {
    e.preventDefault();
    setLoadingAi(true);
    try {
      const pythonApiBase = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5001';
      const response = await fetch(`${pythonApiBase}/predict-msp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiForm),
      });
      const data = await response.json();
      if (response.ok) {
        setPredictedPrice(data.predicted_msp);
      } else {
        alert(data.error || 'Prediction failed');
      }
    } catch (err) {
      console.error('AI API Error:', err);
      alert('Python AI server se connect nahi ho pa raha hai. Ensure kare ki app.py port 5001 par chal raha hai.');
    } finally {
      setLoadingAi(false);
    }
  };

  const mspRates = [
    { crop: 'Gehu (Wheat)', rate: '₹2,275 / Qtl', tag: 'Govt MSP 2026-27' },
    { crop: 'Dhan (Paddy)', rate: '₹2,300 / Qtl', tag: 'Kharif Benchmark' },
    { crop: 'Sarson (Mustard)', rate: '₹5,650 / Qtl', tag: 'Oilseed Quota' },
    { crop: 'Chana (Gram)', rate: '₹5,440 / Qtl', tag: 'Pulses Support' }
  ];

  const features = [
    {
      icon: <CalendarCheck className="w-6 h-6 text-emerald-600" />,
      title: "Smart Slot Booking",
      desc: "Advance mein apne nazdeeki APMC centre par slot book karein aur ghanto lambi line se bachein."
    },
    {
      icon: <Users className="w-6 h-6 text-emerald-600" />,
      title: "4:1 Triage Queue Engine",
      desc: "Advance slot holders aur spot walk-in standby tractors ka santulit prabandhan bina kisi gate vivaad ke."
    },
    {
      icon: <Scale className="w-6 h-6 text-emerald-600" />,
      title: "Anti-Arbitrage Quota Lock",
      desc: "Zameen ke hisaab se fasal tolayi quota track hota hai taaki MSP par bichauliya aur fake anaj bikri poori tarah band ho."
    },
    {
      icon: <Bell className="w-6 h-6 text-emerald-600" />,
      title: "Direct WhatsApp & DBT Alert",
      desc: "Gate scan se lekar dharamkanta tolayi aur DBT bank settlement ka official WhatsApp sandesh seedhe kisan ke phone par."
    }
  ];

  const steps = [
    {
      num: "01",
      title: "Register with Land Details",
      desc: "Apne mobile number aur zameen (Acres) se account banayein. Season quota automatically allot ho jata hai."
    },
    {
      num: "02",
      title: "Select Mandi & Slot",
      desc: "Apni suvidha anusar taareekh aur time window select karke digital gate pass generate karein."
    },
    {
      num: "03",
      title: "Gate Scan & Weighbridge",
      desc: "Yard mein pravesh karte hi QR scan aur dharamkanta par net wazan automatically ledger me darj hoga."
    },
    {
      num: "04",
      title: "Direct DBT Payout",
      desc: "Procurement storage receipt bante hi MSP rashi seedhe Public Financial Management System (PFMS) se bank khate me."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 antialiased overflow-x-hidden">

      {/* Top Govt Trust Strip */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-slate-900 text-slate-300 text-[11px] py-2 px-4 border-b border-slate-800"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold text-white tracking-wide">SmartMandi Unified Procurement Network</span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-slate-400">Integrated APMC Yard Logistics & Direct DBT Settlements</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
              <PhoneCall className="w-3 h-3 text-emerald-400" /> Helpline: 1800-180-1551
            </span>
            <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">● Secure Portal</span>
          </div>
        </div>
      </motion.div>

      {/* Navigation Bar - Redesigned Single-Line & Fully Responsive */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2">

          {/* Brand Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <motion.div
              whileHover={{ rotate: 12, scale: 1.08 }}
              className="bg-gradient-to-tr from-emerald-600 to-teal-500 p-2 rounded-xl text-white shadow-md shadow-emerald-200/50"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.div>
            <div>
              <span className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                Smart<span className="text-emerald-600">Mandi</span>
              </span>
              <span className="hidden sm:block text-[9px] font-extrabold tracking-widest text-slate-400 uppercase -mt-1">
                Digital APMC Yard System
              </span>
            </div>
          </div>

          {/* Desktop Nav Links (Single-Line Compact Row) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 text-xs xl:text-sm font-semibold text-slate-600 whitespace-nowrap">
            <a href="#home" className="px-3.5 py-2 rounded-xl text-emerald-700 bg-white shadow-xs transition-all">Home</a>
            <a href="#ai-predictor" className="px-3.5 py-2 rounded-xl hover:text-slate-900 hover:bg-white/60 transition-all flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-emerald-600" /> AI Predictor</a>
            <a href="#stats" className="px-3.5 py-2 rounded-xl hover:text-slate-900 hover:bg-white/60 transition-all">Live Pulse</a>
            <a href="#radar" className="px-3.5 py-2 rounded-xl hover:text-slate-900 hover:bg-white/60 transition-all">Congestion</a>
            <a href="#msp" className="px-3.5 py-2 rounded-xl hover:text-slate-900 hover:bg-white/60 transition-all">Official MSP</a>
            <a href="#graph" className="px-3.5 py-2 rounded-xl hover:text-slate-900 hover:bg-white/60 transition-all">Analytics</a>
          </nav>

          {/* Dynamic Desktop Actions Based on Auth & Role */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            {user ? (
              <>
                {isAdminOrOperator ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate('/admin')}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer border border-slate-200"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Admin Console</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate('/gate-scanner')}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Scanner</span>
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate('/dashboard')}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer border border-slate-200"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Dashboard</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate('/book')}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book Slot</span>
                    </motion.button>
                  </>
                )}

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={logout}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-all shrink-0 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onLogin || (() => navigate('/login'))}
                  className="px-3 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                >
                  Log In
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onGetStarted || (() => navigate('/register'))}
                  className="px-4.5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-md shadow-emerald-200 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Register</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl shrink-0"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-slate-200 px-6 py-5 space-y-4 shadow-xl"
          >
            <nav className="flex flex-col space-y-2">
              <a href="#home" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">Home Portal</a>
              <a href="#ai-predictor" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">AI Price Predictor</a>
              <a href="#stats" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">Live Mandi Data</a>
              <a href="#radar" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">Yard Congestion</a>
              <a href="#msp" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">Official MSP</a>
              <a href="#graph" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">Graphical Analytics</a>
            </nav>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              {user ? (
                <>
                  {isAdminOrOperator ? (
                    <>
                      <button
                        onClick={() => { setMobileMenuOpen(false); navigate('/admin'); }}
                        className="w-full py-3 px-4 text-xs font-bold border border-slate-200 rounded-xl text-slate-800 flex items-center justify-center gap-2 bg-slate-50"
                      >
                        <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                        <span>Admin Console</span>
                      </button>
                      <button
                        onClick={() => { setMobileMenuOpen(false); navigate('/gate-scanner'); }}
                        className="w-full py-3 px-4 text-xs font-bold bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 shadow-sm"
                      >
                        <QrCode className="w-4 h-4 text-emerald-400" />
                        <span>Gate Scanner</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}
                        className="w-full py-3 px-4 text-xs font-bold bg-emerald-600 text-white rounded-xl shadow-sm flex items-center justify-center gap-2"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Farmer Dashboard</span>
                      </button>
                      <button
                        onClick={() => { setMobileMenuOpen(false); navigate('/book'); }}
                        className="w-full py-3 px-4 text-xs font-bold border border-slate-200 rounded-xl text-slate-800 flex items-center justify-center gap-2 bg-slate-50"
                      >
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span>Book Slot</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                    className="w-full py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center justify-center gap-1.5 mt-1 border border-rose-100"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout ({user.name || user.role})</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => { setMobileMenuOpen(false); onLogin ? onLogin() : navigate('/login'); }}
                    className="w-full py-3 text-sm font-bold border border-slate-200 rounded-xl text-slate-800 bg-slate-50"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onGetStarted ? onGetStarted() : navigate('/register'); }}
                    className="w-full py-3 text-sm font-bold bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-200 flex items-center justify-center gap-2"
                  >
                    <span>Register as Farmer</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.header>

      <main className="flex-1">

        {/* HERO SECTION */}
        <section id="home" className="relative overflow-hidden pt-8 pb-14 sm:pt-12 sm:pb-20 md:py-20 bg-gradient-to-b from-emerald-50/70 via-white to-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left"
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Smart Mandi APMC Queue & Settlement Network</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
                  Smart Mandi Queue, <br className="hidden sm:inline" />
                  <span className="text-emerald-600">Direct DBT Payout</span> for Every Farmer.
                </h1>

                <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Bina highway jam aur lambi katar ke mandi slot schedule karein. QR pass se gate check-in karein, dharamkante par quota verify karwayein aur MSP rashi seedhe bank khate mein payein.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3.5 pt-2">
                  {user ? (
                    isAdminOrOperator ? (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => navigate('/admin')}
                          className="w-full sm:w-auto px-7 py-3.5 sm:py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl sm:rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all text-sm sm:text-base cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                          <span>Open Admin Console</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => navigate('/gate-scanner')}
                          className="w-full sm:w-auto px-6 py-3.5 sm:py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-xs cursor-pointer"
                        >
                          <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Gate Entry Scanner</span>
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => navigate('/dashboard')}
                          className="w-full sm:w-auto px-7 py-3.5 sm:py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl sm:rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all text-sm sm:text-base cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                          <span>Open Farmer Dashboard</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => navigate('/book')}
                          className="w-full sm:w-auto px-6 py-3.5 sm:py-4 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl sm:rounded-2xl transition-all text-center text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Book New Slot</span>
                        </motion.button>
                      </>
                    )
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onGetStarted || (() => navigate('/register'))}
                        className="w-full sm:w-auto px-7 py-3.5 sm:py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl sm:rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all text-sm sm:text-base cursor-pointer"
                      >
                        <span>Register as Farmer</span>
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onLogin || (() => navigate('/login'))}
                        className="w-full sm:w-auto px-6 py-3.5 sm:py-4 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl sm:rounded-2xl transition-all text-center text-sm shadow-xs flex items-center justify-center cursor-pointer"
                      >
                        Login to Account
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-5 flex justify-center w-full"
              >
                <div className="relative w-full max-w-sm sm:max-w-md">
                  <div className="absolute -inset-3 sm:-inset-4 bg-emerald-200/50 rounded-3xl blur-2xl -z-10 animate-pulse" />

                  <div className="relative bg-white p-3 sm:p-4 rounded-3xl border border-slate-100 shadow-xl sm:shadow-2xl overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=900"
                      alt="Farmer checking procurement details on mobile"
                      className="rounded-2xl object-cover w-full h-64 sm:h-80 md:h-96"
                      loading="lazy"
                    />

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">
                          Live In-Yard Load
                        </div>
                        <div className="text-base sm:text-xl font-black text-slate-900 truncate">
                          {realData.activeInYard} Tractors In Queue
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] sm:text-xs font-bold">
                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        <span>~{realData.avgTurnaround}m Wait</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* AI LINEAR REGRESSION PRICE PREDICTOR WIDGET SECTION */}
        <section id="ai-predictor" className="py-14 sm:py-20 bg-slate-900 text-white border-y border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                <Cpu className="w-4 h-4 text-emerald-400" /> Python Random Forest Model
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                AI Crop Price & MSP Predictor
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Production cost aur domestic market values ke aadhar par Python microservice se live price predict karein.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              <form onSubmit={handlePredictPrice} className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Crop Name</label>
                    <select
                      value={aiForm.Crop_Name}
                      onChange={(e) => setAiForm({ ...aiForm, Crop_Name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="Wheat">Wheat (Gehu)</option>
                      <option value="Paddy">Paddy (Dhan)</option>
                      <option value="Mustard">Mustard (Sarson)</option>
                      <option value="Gram">Gram (Chana)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Year</label>
                    <input
                      type="number"
                      value={aiForm.Year}
                      onChange={(e) => setAiForm({ ...aiForm, Year: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Production Cost (₹)</label>
                    <input
                      type="number"
                      value={aiForm.Production_Cost}
                      onChange={(e) => setAiForm({ ...aiForm, Production_Cost: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Demand & Supply</label>
                    <select
                      value={aiForm.DemandSupply}
                      onChange={(e) => setAiForm({ ...aiForm, 'DemandSupply': e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Domestic Market Price (₹)</label>
                    <input
                      type="number"
                      value={aiForm.Domestic_Market_Price}
                      onChange={(e) => setAiForm({ ...aiForm, Domestic_Market_Price: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Inflation Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={aiForm.Inflation_Rate}
                      onChange={(e) => setAiForm({ ...aiForm, Inflation_Rate: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loadingAi}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loadingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{loadingAi ? 'AI Predicting Price...' : 'Calculate Predicted MSP'}</span>
                </motion.button>
              </form>

              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs uppercase font-bold tracking-wider text-slate-400">AI Model Output (MSP)</div>
                  <div className="text-3xl sm:text-4xl font-black text-emerald-400 mt-2 font-mono">
                    {predictedPrice !== null ? `₹${predictedPrice.toFixed(2)}` : '₹ ----'}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Yeh output Python Flask server par chal rahe trained Random Forest model dwara real-time generate kiya gaya hai.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* REAL METRICS PULSE STRIP */}
        <section id="stats" className="bg-emerald-900 text-white py-8 border-y border-emerald-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">

              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-1">
                  {loadingMetrics ? <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-300" /> : `${realData.totalFarmers}`}
                </div>
                <div className="text-[11px] sm:text-xs text-emerald-200 uppercase font-semibold">
                  Farmers Onboarded (DB)
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                  {loadingMetrics ? <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-300" /> : realData.totalMT}
                </div>
                <div className="text-[11px] sm:text-xs text-emerald-200 uppercase font-semibold">
                  Total Procured (MT)
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-emerald-400 font-mono">
                  {loadingMetrics ? <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-300" /> : realData.formattedDBT}
                </div>
                <div className="text-[11px] sm:text-xs text-emerald-200 uppercase font-semibold">
                  Direct DBT Settled
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                  &lt; {realData.avgTurnaround} Mins
                </div>
                <div className="text-[11px] sm:text-xs text-emerald-200 uppercase font-semibold">
                  Avg Yard Turnaround
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* REAL MANDI YARDS CONGESTION RADAR */}
      <PriceTrendWidget />
        {/* 4-STEP HOW IT WORKS SECTION */}
        <Workcard steps={steps} />

        {/* FEATURE CARDS GRID */}
            <FeatureCard features={features} />

        {/* BOTTOM CTA SECTION */}
       <CardHomeLogin user={user} onGetStarted={onGetStarted} onLogin={onLogin} isAdminOrOperator={isAdminOrOperator} navigate={navigate} />

      </main>

      {/* Footer Component Integration */}
        <Footer />
     
    </div>
  );
}