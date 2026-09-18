import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Download, 
  ArrowLeft,
  Hourglass,
  Check,
  Building2,
  Maximize2,
  AlertTriangle,
  FileText,
  HelpCircle,
  Wheat,
  X,
  Lock,
  Unlock,
  Navigation,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import api from '../api/api';
import { socket } from '../api/socket';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

const STAGES = [
  { key: 'booked', label: 'Booking Confirmed' },
  { key: 'arrived', label: 'Gate Check-in Verified' },
  { key: 'verification', label: 'Document Verification' },
  { key: 'weighing', label: 'Weighbridge Tolayi' },
  { key: 'quality_check', label: 'Quality Assessment' },
  { key: 'procurement', label: 'Procurement Recorded' },
  { key: 'payment', label: 'DBT Payment Disbursed' }
];

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeBookingId, setActiveBookingId] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // 🟢 Exact Same Geofence States as FarmerDashboard
  const [geoDistance, setGeoDistance] = useState(null);
  const [isInsideYard, setIsInsideYard] = useState(false);
  const [geoChecking, setGeoChecking] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await api.get('/bookings/my');
      const list = res.data || [];
      setBookings(list);
      if (list.length > 0 && !activeBookingId) {
        setActiveBookingId(list[0]._id);
      }
    } catch (err) {
      setError('Aapki bookings load nahi ho saki. Kripya refresh karein.');
    } finally {
      setLoading(false);
    }
  };

  const activeBooking = useMemo(() => {
    return bookings.find((b) => b._id === activeBookingId) || bookings[0] || null;
  }, [bookings, activeBookingId]);

  // 🟢 Exact Same Geofence Verifier as FarmerDashboard (/bookings/verify-geofence)
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
    load();

    const farmerId = user?.id || user?._id;
    if (farmerId) {
      socket.emit('joinFarmerRoom', farmerId);
    }

    const handleUpdate = (update) => {
      setBookings((prev) =>
        prev.map((b) =>
          b._id === update.bookingId
            ? { 
                ...b, 
                queuePosition: update.queuePosition, 
                etaMinutes: update.etaMinutes, 
                status: update.status,
                assignedCounter: update.assignedCounter || b.assignedCounter
              }
            : b
        )
      );
    };

    socket.on('queueUpdate', handleUpdate);
    const interval = setInterval(load, 15000);

    return () => {
      socket.off('queueUpdate', handleUpdate);
      clearInterval(interval);
    };
  }, [user]);

  // 🟢 Periodic Geofence Check (Exact same trigger as FarmerDashboard)
  useEffect(() => {
    if (activeBooking?._id && activeBooking.status === 'booked') {
      verifyMandiProximity(activeBooking._id);
      const interval = setInterval(() => verifyMandiProximity(activeBooking._id), 25000);
      return () => clearInterval(interval);
    }
  }, [activeBooking?._id, activeBooking?.status, verifyMandiProximity]);

  const getStageIndex = (status) => {
    if (status === 'completed') return STAGES.length;
    const idx = STAGES.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  const qrPayload = activeBooking
    ? JSON.stringify({
        bookingId: activeBooking._id,
        tokenNumber: activeBooking.tokenNumber
      })
    : '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between no-print">
          <button
            onClick={() => navigate('/book')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Book New Slot
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full">
            Live Token Tracker
          </span>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2 font-semibold no-print">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-500 text-sm">Syncing live queue countdown...</div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm no-print">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-900">No Scheduled Bookings Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              Aapne abhi tak koi mandi token book nahi kiya hai. Abhi slot book karein.
            </p>
            <button
              onClick={() => navigate('/book')}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-all cursor-pointer"
            >
              Book First Slot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: All Bookings List */}
            <div className="lg:col-span-5 space-y-3 no-print">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                Your Slots & Tokens ({bookings.length})
              </h2>

              {bookings.map((b) => {
                const isSelected = activeBooking?._id === b._id;
                const isMissed = b.status === 'missed';

                return (
                  <div
                    key={b._id}
                    onClick={() => setActiveBookingId(b._id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-emerald-600 ring-2 ring-emerald-500 shadow-md'
                        : isMissed
                        ? 'bg-rose-50/50 border-rose-200 opacity-80'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {isMissed ? 'Expired Token' : 'Mandi Token'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        isMissed 
                          ? 'bg-rose-100 text-rose-800' 
                          : b.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {b.status}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div className="text-3xl font-black text-slate-900">#{b.tokenNumber}</div>
                      <div className="text-xs text-slate-500 text-right space-y-0.5">
                        <div className="font-bold text-slate-800">{b.center?.name || 'Mandi Yard'}</div>
                        <div>{b.slot?.date} · {b.slot?.timeSlot}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Active Token Live Status */}
            {activeBooking && (
              <div className="lg:col-span-7 space-y-5">
                
                {/* Missed Recovery Banner */}
                {activeBooking.status === 'missed' && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 no-print">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-rose-800 space-y-1">
                      <div className="font-bold">Aapka scheduled time nikal chuka hai.</div>
                      <p>System ne slot recovery activate kar di hai. Kripya naya slot book karein ya help desk par sampark karein.</p>
                    </div>
                  </div>
                )}

                {/* Main Live Queue Card */}
                <div className="bg-emerald-700 text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
                  <div className="relative z-10 space-y-4">
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">
                        Live Yard Token
                      </span>
                      <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold">
                        {activeBooking.center?.name}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between flex-wrap gap-2">
                      <div className="text-5xl sm:text-6xl font-black tracking-tight">
                        #{activeBooking.tokenNumber}
                      </div>

                      {/* Desk Assignment Indicator */}
                      <div className="px-3 py-1.5 bg-emerald-800/90 rounded-xl text-right border border-emerald-600/60">
                        <div className="text-[10px] text-emerald-300 font-bold uppercase">Assigned Desk</div>
                        <div className="text-xs font-extrabold text-white">
                          {activeBooking.assignedCounter || 'Counter 1 (Verification)'}
                        </div>
                      </div>
                    </div>

                    {/* Queue Count & Turnaround countdown */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-600/60">
                      <div>
                        <div className="text-xs text-emerald-200 uppercase font-semibold">Farmers Ahead</div>
                        <div className="text-2xl font-black mt-0.5">
                          {activeBooking.queuePosition != null ? `${activeBooking.queuePosition} in queue` : 'Your Turn'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-emerald-200 uppercase font-semibold">Estimated Wait</div>
                        <div className="text-2xl font-black mt-0.5 flex items-center gap-1.5">
                          <Hourglass className="w-5 h-5 text-emerald-300 animate-pulse" />
                          <span>{activeBooking.etaMinutes != null ? `~${activeBooking.etaMinutes} mins` : 'Immediate'}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                </div>

                {/* 🟢 Mandi Schedule & Entry QR Pass (WITH FARMER DASHBOARD GEOFENCE BLUR SYSTEM) */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 no-print">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">Gate Pass & Details</h3>
                    
                    {/* Status Pill */}
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      isInsideYard 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {isInsideYard ? (
                        <>
                          <Unlock className="w-3 h-3 text-emerald-700" />
                          <span>Gate Pass Active</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-amber-700" />
                          <span>Holding Zone (Locked)</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Geofence Alert Strip matching FarmerDashboard */}
                  <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                    isInsideYard 
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900' 
                      : 'bg-amber-50/70 border-amber-300 text-amber-900'
                  }`}>
                    <div className="flex items-center gap-2">
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
                            ? `Aap mandi se ${geoDistance || 0}m door hain. Gate guard ko scan karwayein.`
                            : `Aap mandi se ${geoDistance ? `${geoDistance}m` : 'door'} hain. 800m daayre me aane par hi pass unblur hoga.`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    
                    {/* Booking Details */}
                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <span><strong>Center:</strong> {activeBooking.center?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span><strong>Location:</strong> {activeBooking.center?.location || 'Central Mandi'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span><strong>Date:</strong> {activeBooking.slot?.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span><strong>Slot:</strong> {activeBooking.slot?.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wheat className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span><strong>Crop:</strong> {activeBooking.cropType || 'Wheat (FAQ Grade)'}</span>
                      </div>

                      {/* GPS Distance Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => verifyMandiProximity(activeBooking._id)}
                          disabled={geoChecking}
                          className="py-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${geoChecking ? 'animate-spin text-emerald-600' : ''}`} />
                          <span>Refresh GPS</span>
                        </button>

                        {/* Demo Testing Switch */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsInsideYard((prev) => !prev);
                            setGeoDistance((prev) => (prev <= 800 ? 810484 : 350));
                          }}
                          className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold rounded-xl text-[11px] transition-colors cursor-pointer"
                          title="Simulate distance for demo"
                        >
                          {isInsideYard ? 'Simulate >800m' : 'Simulate <800m'}
                        </button>
                      </div>

                      {geoError && (
                        <span className="text-[10px] text-rose-600 font-medium block">
                          {geoError}
                        </span>
                      )}
                    </div>

                    {/* 🟢 QR Code Container with Geofence Blur */}
                    <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50 border border-slate-200 rounded-2xl relative overflow-hidden">
                      <div className="relative bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 flex justify-center items-center min-w-[130px] min-h-[130px]">
                        
                        {/* Dynamic Blur Filter */}
                        <div className={`transition-all duration-500 ${
                          isInsideYard
                            ? 'blur-none opacity-100 scale-100'
                            : 'blur-md grayscale opacity-30 scale-95 pointer-events-none select-none'
                        }`}>
                          <QRCodeSVG
                            value={qrPayload}
                            size={115}
                            level="H"
                            includeMargin={false}
                          />
                        </div>

                        {/* Locked Overlay when outside geofence */}
                        {!isInsideYard && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-slate-900/40 backdrop-blur-[1.5px] rounded-xl text-white">
                            <Lock className="w-5 h-5 text-amber-400 mb-1" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                              PASS BLURRED
                            </span>
                            <span className="text-[8px] font-medium text-slate-200 mt-0.5 leading-tight">
                              800m daayre mein aane par hi active hoga.
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        className="mt-2 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" /> Tap to Enlarge
                      </button>
                    </div>

                  </div>
                </div>

                {/* Stage Stepper Progress */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 no-print">
                  <h3 className="font-bold text-slate-900 text-sm">Procurement Lifecycle</h3>
                  
                  <div className="relative space-y-4 pt-1">
                    {STAGES.map((stage, idx) => {
                      const currentIdx = getStageIndex(activeBooking.status);
                      const isDone = idx < currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div key={stage.key} className="flex items-start gap-3 relative">
                          {idx !== STAGES.length - 1 && (
                            <div
                              className={`absolute left-[13px] top-6 w-0.5 h-7 transition-colors ${
                                isDone ? 'bg-emerald-500' : 'bg-slate-200'
                              }`}
                            />
                          )}

                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                              isDone
                                ? 'bg-emerald-500 text-white'
                                : isCurrent
                                ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                          </div>

                          <div className="pt-0.5">
                            <div
                              className={`text-xs sm:text-sm font-semibold ${
                                isDone || isCurrent ? 'text-slate-900' : 'text-slate-400'
                              }`}
                            >
                              {stage.label}
                            </div>
                            {isCurrent && (
                              <div className="text-[11px] text-emerald-700 font-bold mt-0.5">In progress right now</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Printable Official Payment Receipt Slip */}
                {activeBooking.paymentStatus === 'paid' && (
                  <div className="bg-emerald-50/90 border border-emerald-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                          DBT Payment Disbursed
                        </span>
                      </div>
                      <span className="text-[11px] font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full">
                        Govt. MSP Settled
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500">Transaction ID:</span>
                        <div className="font-mono font-bold text-slate-900 mt-0.5">
                          {activeBooking.transactionId || `TXN${activeBooking._id.slice(-8).toUpperCase()}`}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Weighed Quantity:</span>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {activeBooking.quantityQuintal || 25} Quintals
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Benchmark Rate:</span>
                        <div className="font-bold text-slate-900 mt-0.5">
                          ₹{activeBooking.ratePerQuintal || 2275} / Quintal
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Net Amount Paid:</span>
                        <div className="text-xl font-black text-emerald-700 mt-0.5">
                          ₹{activeBooking.amountPaid?.toLocaleString('en-IN') || '56,875'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => window.print()}
                      className="w-full py-3 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-900 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm no-print cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download / Print MSP Payment Slip</span>
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </div>

      {/* Full-Screen QR Modal (Respects Geofence Blur Lock) */}
      {showQrModal && activeBooking && (
        <div 
          onClick={() => setShowQrModal(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-xs w-full text-center space-y-4 shadow-2xl relative"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gate Entry Ticket</span>
              <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-4xl font-black text-slate-900">#{activeBooking.tokenNumber}</h3>

            <div className="bg-white p-3 rounded-2xl border border-slate-100 flex justify-center shadow-inner relative overflow-hidden min-h-[230px] items-center">
              <div className={`transition-all duration-500 ${
                isInsideYard ? 'blur-none opacity-100' : 'blur-md grayscale opacity-30 select-none pointer-events-none'
              }`}>
                <QRCodeSVG
                  value={qrPayload}
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {!isInsideYard && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-900/40 backdrop-blur-[2px] text-white">
                  <Lock className="w-8 h-8 text-amber-400 mb-2" />
                  <span className="text-sm font-black uppercase text-amber-300">PASS BLURRED & LOCKED</span>
                  <p className="text-[10px] text-slate-200 mt-1 leading-tight">
                    Mandi ke 800m daayre mein aane par hi scan QR unlock hoga.
                  </p>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              {isInsideYard 
                ? 'Screen brightness full karein aur mandi gate guard ke scanner ke samne rakhein.'
                : 'Aap mandi holding perimeter se bahar hain.'}
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Hidden Print-Only Styling Helper */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}