import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarPlus, 
  Ticket, 
  Clock, 
  Wheat, 
  ArrowRight, 
  Building2, 
  MapPin,
  RefreshCw,
  Navigation,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { socket } from '../api/socket';

export default function FarmerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeBooking, setActiveBooking] = useState(null);
  const [centers, setCenters] = useState([]);
  const [stats, setStats] = useState({ totalBookings: 0, totalPaid: 0 });
  const [loading, setLoading] = useState(true);

  // Geofence states
  const [geoDistance, setGeoDistance] = useState(null);
  const [isInsideYard, setIsInsideYard] = useState(false);
  const [geoChecking, setGeoChecking] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, centersRes] = await Promise.all([
        api.get('/bookings/my'),
        api.get('/centers')
      ]);

      const myBookings = bookingsRes.data || [];
      const active = myBookings.find((b) => b.status !== 'completed' && b.status !== 'missed') || myBookings[0] || null;
      setActiveBooking(active);

      const totalAmount = myBookings
        .filter((b) => b.paymentStatus === 'paid')
        .reduce((sum, b) => sum + (b.amountPaid || 0), 0);

      setStats({
        totalBookings: myBookings.length,
        totalPaid: totalAmount
      });

      setCenters(centersRes.data || []);
    } catch (err) {
      console.error('Error fetching farmer dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Live Geofence Proximity Verifier
  const verifyMandiProximity = useCallback(async (bookingId) => {
    if (!bookingId || !navigator.geolocation) {
      setGeoError('GPS available nahi hai');
      return;
    }

    setGeoChecking(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await api.post('/bookings/verify-geofence', {
            bookingId,
            userLat: latitude,
            userLng: longitude
          });

          setGeoDistance(res.data.distanceMeters);
          setIsInsideYard(res.data.isInside);
          setGeoError(null);
        } catch (err) {
          console.error('Geofence error', err);
        } finally {
          setGeoChecking(false);
        }
      },
      (err) => {
        setGeoError('Kripya GPS Location allow karein');
        setGeoChecking(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const farmerId = user?.id || user?._id;
    if (farmerId) {
      socket.emit('joinFarmerRoom', farmerId);
    }

    const handleQueueUpdate = (update) => {
      setActiveBooking((prev) => {
        if (prev && prev._id === update.bookingId) {
          return { ...prev, ...update };
        }
        return prev;
      });
    };

    socket.on('queueUpdate', handleQueueUpdate);

    return () => {
      socket.off('queueUpdate', handleQueueUpdate);
    };
  }, [user]);

  // Periodic Geofence checks when active booking exists
  useEffect(() => {
    if (activeBooking?._id && activeBooking.status === 'booked') {
      verifyMandiProximity(activeBooking._id);
      const interval = setInterval(() => verifyMandiProximity(activeBooking._id), 25000);
      return () => clearInterval(interval);
    }
  }, [activeBooking?._id, activeBooking?.status, verifyMandiProximity]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
        
        {/* Welcome Greeting Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 text-white p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[11px] font-bold tracking-wider uppercase text-emerald-200">
              <Wheat className="w-3.5 h-3.5" /> 
              <span>Farmer Self-Service Desk</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-snug">
              Ram Ram, {user?.name || 'Kisan'}!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-lg leading-relaxed">
              Apni fasal procurement ka token live track karein ya naye slot ke liye seedhe booking karein.
            </p>
          </div>

          <div className="relative z-10 w-full sm:w-auto">
            <button
              onClick={() => navigate('/book')}
              className="w-full sm:w-auto px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 active:bg-emerald-100 text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <CalendarPlus className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="whitespace-nowrap">Book New Slot</span>
            </button>
          </div>

          <div className="absolute -right-10 -bottom-10 w-52 h-52 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Overview Stat Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bookings</span>
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mt-1">{stats.totalBookings}</div>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total DBT Received</span>
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-700 mt-1 truncate">
              ₹{stats.totalPaid.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-1 bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Registered District</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 truncate mt-1">
              {user?.district || 'Central District'}
            </div>
          </div>
        </div>

        {/* Active Mandi Pass with Virtual Geofence Radar */}
        {loading ? (
          <div className="bg-white p-8 sm:p-12 rounded-2xl sm:rounded-3xl border border-slate-200 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs sm:text-sm text-slate-500 font-semibold">Aapke slots aur mandi status load ho rahe hain...</p>
          </div>
        ) : activeBooking ? (
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
            
            {/* Pass Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-600 shrink-0" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                  Active Procurement Pass
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-[11px] font-black uppercase px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                  Stage: {activeBooking.status}
                </span>
                {activeBooking.status === 'booked' && (
                  <span className={`text-[10px] sm:text-[11px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 ${
                    isInsideYard 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' 
                      : 'bg-amber-50 text-amber-800 border border-amber-300'
                  }`}>
                    <Navigation className="w-3 h-3" />
                    {isInsideYard ? 'Within Mandi Radius' : 'Holding Zone Active'}
                  </span>
                )}
              </div>
            </div>

            {/* Geofenced Advisory Banner */}
            {activeBooking.status === 'booked' && (
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                isInsideYard 
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900' 
                  : 'bg-amber-50/70 border-amber-300 text-amber-900'
              }`}>
                <div className="flex items-center gap-2.5">
                  {isInsideYard ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {isInsideYard 
                        ? '✅ Mandi Perimeter Cleared: QR Pass Active' 
                        : '⏳ Holding Parking Mode Active'}
                    </span>
                    <span className="text-[11px] opacity-80">
                      {isInsideYard 
                        ? `Aap mandi se ${geoDistance}m door hain. Gate guard ko scan karwayein.`
                        : `Aap mandi se ${geoDistance ? `${geoDistance}m` : 'door'} hain. Highway jam roknay ke liye 800m daayre me aane par hi pass active hoga.`}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => verifyMandiProximity(activeBooking._id)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-[11px] hover:bg-slate-50 shrink-0 shadow-sm flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${geoChecking ? 'animate-spin' : ''}`} />
                  <span>Refresh GPS</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center">
              
              {/* Token Display Box with Smart Lock Status */}
              <div className={`md:col-span-4 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center space-y-1 border ${
                activeBooking.status === 'booked' && !isInsideYard
                  ? 'bg-slate-100 border-slate-300 text-slate-500'
                  : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
              }`}>
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                  {activeBooking.status === 'booked' && !isInsideYard ? (
                    <span className="text-amber-800 flex items-center gap-1"><Lock className="w-3 h-3" /> Virtual Hold</span>
                  ) : (
                    <span className="text-emerald-800">Your Token</span>
                  )}
                </div>
                
                <div className="text-4xl sm:text-5xl font-black tracking-tight">
                  #{activeBooking.tokenNumber}
                </div>
                
                <div className="text-xs font-semibold pt-1">
                  {activeBooking.cropType || 'Wheat'} · {activeBooking.slot?.date}
                </div>
              </div>

              {/* Booking Details */}
              <div className="md:col-span-5 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="break-words">
                    <strong className="text-slate-700">Centre:</strong> {activeBooking.center?.name || 'Mandi Yard'}
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-700">Scheduled Slot:</strong> {activeBooking.slot?.timeSlot}
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  <span className="break-words">
                    <strong className="text-slate-700">Live Desk:</strong> {activeBooking.assignedCounter || 'Counter 1 (Verification)'}
                  </span>
                </div>
                {activeBooking.etaMinutes && (
                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    <span>
                      <strong className="text-slate-700">Estimated Turnaround:</strong> <span className="text-blue-700 font-bold">~{activeBooking.etaMinutes} mins</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="md:col-span-3 flex flex-col pt-2 md:pt-0">
                <button
                  onClick={() => navigate('/my-bookings')}
                  className={`w-full py-3 px-4 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                    activeBooking.status === 'booked' && !isInsideYard
                      ? 'bg-slate-700 hover:bg-slate-800 shadow-slate-200'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                  }`}
                >
                  <span>{activeBooking.status === 'booked' && !isInsideYard ? 'View Holding Pass' : 'Open Gate Pass QR'}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
                {geoError && (
                  <span className="text-[10px] text-red-500 font-medium text-center mt-1.5 block">
                    {geoError}
                  </span>
                )}
              </div>

            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center space-y-3">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">Koi Active Slot Scheduled Nahi Hai</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Fasal tolayi aur MSP bikri ke liye abhi slot schedule karein.
            </p>
            <button
              onClick={() => navigate('/book')}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              Book Slot
            </button>
          </div>
        )}

        {/* Nearby Mandi Rush Status */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 px-1">
              Nearby Mandi Yard Live Rush
            </h3>
            <span className="text-[11px] font-semibold text-emerald-700">Auto-updating</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {centers.map((c) => (
              <div 
                key={c._id}
                onClick={() => navigate('/book')}
                className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all active:scale-[0.99] cursor-pointer flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-slate-900 truncate">{c.name}</h4>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> 
                      <span className="truncate">{c.location}</span>
                    </span>
                  </div>
                  {c.isRecommended && (
                    <span className="shrink-0 text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                      Fastest
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">Wait Time:</span>
                  <strong className="text-emerald-700">{c.estimatedWaitTime || '~20 mins'}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}