import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Building2,
  Calendar,
  Clock,
  Users,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Sparkles,
  ArrowRight,
  RefreshCw,
  QrCode,
  Layers,
  Activity,
  Search,
  Zap,
  Wheat,
  SlidersHorizontal,
  X,
  RotateCcw,
  ShieldCheck,
  Scale,
  Truck,
  TrendingUp,
  Timer
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../api/api';
import { socket } from '../api/socket';

// Flask ML Service URL (Port 5001)
const ML_API_BASE_URL = 'http://localhost:5001';

const STAGE_FLOW = [
  'booked',
  'arrived',
  'verification',
  'weighing',
  'quality_check',
  'procurement',
  'payment',
  'completed'
];

const STAGE_CONFIG = {
  booked: { label: 'Booked', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  arrived: { label: 'Arrived', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  verification: { label: 'Verification', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  weighing: { label: 'Weighing', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  quality_check: { label: 'Quality Check', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  procurement: { label: 'Procuring', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  payment: { label: 'Payment Due', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  completed: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  missed: { label: 'Missed', color: 'bg-rose-50 text-rose-700 border-rose-200' }
};

function nextStage(current) {
  const idx = STAGE_FLOW.indexOf(current);
  if (idx === -1 || idx === STAGE_FLOW.length - 1) return null;
  return STAGE_FLOW[idx + 1];
}

// -------------------------------------------------------------
// Integrated Gate QR Camera Scanner Modal
// -------------------------------------------------------------
function GateScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [scanResult, setScanResult] = useState(null);
  const [errorData, setErrorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);
  const isProcessingRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
      } finally {
        scannerRef.current = null;
      }
    }
  }, []);

  const handleGateCheckIn = async (qrData) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setLoading(true);
    setErrorData(null);

    try {
      let bookingId = qrData;
      try {
        const parsed = JSON.parse(qrData);
        bookingId = parsed.bookingId || parsed._id || qrData;
      } catch (e) { }

      const res = await api.post(`/bookings/checkin/${bookingId}`);
      setScanResult(res.data);
      if (onScanSuccess) onScanSuccess(res.data);
    } catch (err) {
      const data = err.response?.data;
      setErrorData(data || { message: 'Check-in failed! Ticket invalid ya unreadable hai.' });
    } finally {
      setLoading(false);
    }
  };

  const startScanner = useCallback(async () => {
    await stopScanner();
    setErrorData(null);
    setScanResult(null);
    isProcessingRef.current = false;

    setTimeout(async () => {
      const el = document.getElementById('modal-scanner-viewport');
      if (!el) return;

      const html5Qr = new Html5Qrcode('modal-scanner-viewport');
      scannerRef.current = html5Qr;

      try {
        await html5Qr.start(
          { facingMode: 'environment' },
          { fps: 15, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
          async (decodedText) => {
            if (!isProcessingRef.current) {
              await stopScanner();
              handleGateCheckIn(decodedText);
            }
          },
          () => { }
        );
      } catch (err) {
        setErrorData({ message: 'Camera permission allow karein ya ensure karein camera doosre app me open na ho.' });
      }
    }, 150);
  }, [stopScanner]);

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen, startScanner, stopScanner]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="p-4 px-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Mandi Gate Check-In</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {!scanResult && !errorData && (
            <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-inner flex items-center justify-center">
              <div id="modal-scanner-viewport" className="w-full h-full" />
              {loading && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
                  <span className="text-xs font-bold text-slate-200">Verifying Ticket...</span>
                </div>
              )}
            </div>
          )}

          {scanResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Gate Verified
                </span>
                <h3 className="text-3xl font-black text-slate-900 mt-1">
                  Token #{scanResult.tokenNumber || scanResult.booking?.tokenNumber}
                </h3>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {scanResult.farmerName || scanResult.booking?.farmer?.name || 'Farmer'} ({scanResult.phone || scanResult.farmerPhone || 'Verified'})
              </p>
              <div className="text-[11px] text-emerald-800 bg-emerald-100/70 p-2 rounded-xl">
                Ready for: <strong>Counter 1 (Verification)</strong>
              </div>
              <button
                onClick={startScanner}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Scan Next Pass</span>
              </button>
            </div>
          )}

          {errorData && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-3 text-left">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs leading-tight">
                    {errorData.message || 'Check-in Failed!'}
                  </h4>
                </div>
              </div>
              <button
                onClick={startScanner}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Scan Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Dedicated Weighbridge & Land Quota Lock Modal
// -------------------------------------------------------------
function WeighbridgeModal({ isOpen, onClose, booking, onSuccess }) {
  const [gross, setGross] = useState('');
  const [tare, setTare] = useState('');
  const [quotaAlert, setQuotaAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !booking) return null;

  const netQuintal = Math.max(0, Number(gross || 0) - Number(tare || 0));

  const handleWeighmentSubmit = async (e) => {
    e.preventDefault();
    setQuotaAlert(null);
    setLoading(true);

    try {
      const res = await api.put('/bookings/record-weighment-quota', {
        bookingId: booking._id,
        grossQuintal: gross,
        tareQuintal: tare
      });

      if (onSuccess) onSuccess(res.data);
      onClose();
      setGross('');
      setTare('');
    } catch (err) {
      if (err.response?.data?.errorType === 'QUOTA_EXCEEDED_ARBITRAGE_RISK') {
        setQuotaAlert(err.response.data.message);
      } else {
        setQuotaAlert(err.response?.data?.message || 'Weighment recording failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-fadeIn">
        <div className="p-4 px-5 bg-purple-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-sm">Weighbridge & Quota Lock — #{booking.tokenNumber}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-900">
            <strong>Farmer:</strong> {booking.farmer?.name || 'Kisan'} ({booking.farmer?.phone || 'N/A'})
            <div className="text-[11px] text-purple-700 mt-0.5">Crop: {booking.cropType || 'Wheat'}</div>
          </div>

          {quotaAlert && (
            <div className="p-3.5 bg-rose-50 border border-rose-400 rounded-xl text-xs text-rose-800 font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>🚨 {quotaAlert}</span>
            </div>
          )}

          <form onSubmit={handleWeighmentSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Gross Weight (Quintals with Tractor)
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 145"
                value={gross}
                onChange={(e) => setGross(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Tare Weight (Empty Tractor Quintals)
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 45"
                value={tare}
                onChange={(e) => setTare(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">Net Crop Weight:</span>
              <span className="text-base text-purple-900 font-mono">{netQuintal} Quintals</span>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || netQuintal <= 0}
                className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Confirm & Lock Quota'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Main Admin Dashboard
// -------------------------------------------------------------
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('queue');
  const [centers, setCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState('');
  const [queue, setQueue] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  // 4:1 Triage Dispatcher States
  const [triageRatioStatus, setTriageRatioStatus] = useState('0/4 Regular Served');
  const [activeTractorCall, setActiveTractorCall] = useState(null);
  const [dispatchLoading, setDispatchLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Quantities Draft State
  const [quantitiesDraft, setQuantitiesDraft] = useState({});

  // Forms
  const [centerForm, setCenterForm] = useState({ name: '', district: '', location: '' });
  const [slotForm, setSlotForm] = useState({ center: '', date: '', timeSlot: '', capacity: 25 });

  // Combined ML Crowd & Waiting Time Prediction States
  const [predictionDate, setPredictionDate] = useState('');
  const [selectedSlotTime, setSelectedSlotTime] = useState('09:00-11:00');
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [crowdWaitResult, setCrowdWaitResult] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Crop MSP Predictor Form State
  const [mspForm, setMspForm] = useState({
    Crop_Name: 'Wheat',
    Year: 2026,
    Production_Cost: 1800,
    Demand_Supply: 'High',
    Domestic_Market_Price: 2100,
    Inflation_Rate: 4.5
  });
  const [predictedMsp, setPredictedMsp] = useState(null);
  const [mspLoading, setMspLoading] = useState(false);

  // Scanner & Weighbridge Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedBookingForWeighbridge, setSelectedBookingForWeighbridge] = useState(null);

  // Notifications & Loaders
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setFlashMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };
  const setFlashError = (err) => {
    setError(err);
    setTimeout(() => setError(''), 5000);
  };

  // Load Centers & Summary
  const loadInitialData = async () => {
    try {
      const [centersRes, summaryRes] = await Promise.all([
        api.get('/centers'),
        api.get('/analytics/summary').catch(() => ({ data: null }))
      ]);

      const centerList = centersRes.data || [];
      setCenters(centerList);
      if (summaryRes?.data) {
        setSummaryData(summaryRes.data);
      }

      if (centerList.length > 0 && !selectedCenter) {
        setSelectedCenter(centerList[0]._id);
      }
    } catch (err) {
      setFlashError('Centres list load karne mein dikkat hui.');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch queue
  const loadQueue = async (centerId, silent = false) => {
    if (!centerId) {
      setQueue([]);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/bookings/center/${centerId}`);
      const rawQueue = res.data || [];
      setQueue(rawQueue);

      const drafts = {};
      rawQueue.forEach((b) => {
        if (b.quantityQuintal) drafts[b._id] = b.quantityQuintal;
      });
      setQuantitiesDraft((prev) => ({ ...drafts, ...prev }));
    } catch (err) {
      if (!silent) setFlashError('Queue records fetch nahi ho sake.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCenter) {
      loadQueue(selectedCenter);
    }
  }, [selectedCenter]);

  // Real-Time Socket Connection with Live Influx Sync & 4:1 Triage Telemetry
  useEffect(() => {
    if (!selectedCenter) return;

    socket.emit('joinCenterRoom', selectedCenter);

    const handler = (data) => {
      if (data.centerId === selectedCenter) {
        loadQueue(selectedCenter, true);
      }
    };

    const triageHandler = (data) => {
      setActiveTractorCall(data);
      if (data.ratioStatus) {
        setTriageRatioStatus(data.ratioStatus);
      }
      setFlashMessage(`Calling Token #${data.tokenNumber} to ${data.deskStage || 'Verification'}`);
      loadQueue(selectedCenter, true);
    };

    socket.on('centerQueueUpdate', handler);
    socket.on('farmerCalledToDesk', triageHandler);

    return () => {
      socket.off('centerQueueUpdate', handler);
      socket.off('farmerCalledToDesk', triageHandler);
      socket.emit('leaveCenterRoom', selectedCenter);
    };
  }, [selectedCenter]);

  // 4:1 Dispatcher Call Function
  const handleDispatchNextTractor = async () => {
    if (!selectedCenter) {
      setFlashError('Pehle Mandi select karein');
      return;
    }

    setDispatchLoading(true);
    try {
      const res = await api.post('/bookings/dispatch-next', {
        centerId: selectedCenter,
        deskStage: 'verification'
      });

      if (res.data.calledToken) {
        setActiveTractorCall({
          tokenNumber: res.data.calledToken,
          type: res.data.type
        });
        setTriageRatioStatus(`${res.data.cycleCount}/4 Regular Served`);
        setFlashMessage(`Dispatched: Token #${res.data.calledToken} (${res.data.type === 'walk_in' ? 'Standby' : 'Regular'})`);
        loadQueue(selectedCenter, true);
        loadInitialData();
      } else {
        setFlashMessage(res.data.message || 'No tractors waiting at gate.');
      }
    } catch (err) {
      setFlashError(err.response?.data?.message || 'Dispatch action failed');
    } finally {
      setDispatchLoading(false);
    }
  };

  // Create Center
  const createCenter = async (e) => {
    e.preventDefault();
    try {
      await api.post('/centers', centerForm);
      setFlashMessage('Naya Procurement Centre successfully register ho gaya!');
      setCenterForm({ name: '', district: '', location: '' });
      loadInitialData();
    } catch (err) {
      setFlashError(err.response?.data?.message || 'Centre add nahi ho saka');
    }
  };

  // Single Slot Create
  const createSlot = async (e) => {
    e.preventDefault();
    try {
      await api.post('/slots', slotForm);
      setFlashMessage('Procurement slot successfully publish ho gaya!');
      setSlotForm({ ...slotForm, timeSlot: '' });
    } catch (err) {
      setFlashError(err.response?.data?.message || 'Slot create nahi ho saka');
    }
  };

  // 1-Click Full Day Slots
  const handleGenerateDailySlots = async () => {
    if (!slotForm.center || !slotForm.date) {
      setFlashError('Pehle Mandi aur Date select karein');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/slots/generate-daily', {
        center: slotForm.center,
        date: slotForm.date,
        capacity: Number(slotForm.capacity) || 25
      });
      setFlashMessage(res.data.message || 'Din bhar ke standard slots create ho gaye!');
    } catch (err) {
      setFlashError(err.response?.data?.message || 'Daily slots generation fail hua');
    } finally {
      setLoading(false);
    }
  };

  // Stage Progression
  const advanceStage = async (bookingId, current) => {
    const next = nextStage(current);
    if (!next) return;
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: next });
      loadQueue(selectedCenter, true);
      loadInitialData();
    } catch (err) {
      setFlashError(err.response?.data?.message || 'Status update fail hua');
    }
  };

  // Gate Check-in
  const checkInBooking = async (bookingId) => {
    try {
      await api.post(`/bookings/checkin/${bookingId}`);
      setFlashMessage('Farmer gate check-in confirmed!');
      loadQueue(selectedCenter, true);
      loadInitialData();
    } catch (err) {
      const data = err.response?.data;
      const errorMsg = data?.message ||
        (data?.farmerName ? `Token #${data.tokenNumber} (${data.farmerName}) pehle hi check in ho chuka hai.` : 'Check-in failed');
      setFlashError(errorMsg);
    }
  };

  // Mark Paid with Confirmation Guard
  const markPaid = async (id, farmerName) => {
    const qty = quantitiesDraft[id];
    const isConfirmed = window.confirm(
      `Kya aap ${farmerName || 'kisan'} ke liye DBT Payment 'PAID' mark karna chahte hain?`
    );
    if (!isConfirmed) return;

    try {
      await api.put(`/bookings/${id}/status`, {
        paymentStatus: 'paid',
        quantityQuintal: qty ? Number(qty) : undefined
      });
      setFlashMessage('DBT Payment successfully marked as Paid!');
      loadQueue(selectedCenter, true);
      loadInitialData();
    } catch (err) {
      setFlashError(err.response?.data?.message || 'Payment update fail hua');
    }
  };

  // Set Quantity
  const saveQuantity = async (id) => {
    const qty = quantitiesDraft[id];
    if (qty === undefined || qty === '') return;
    try {
      await api.put(`/bookings/${id}/status`, { quantityQuintal: Number(qty) });
      setFlashMessage('Weighbridge quantity updated!');
      loadQueue(selectedCenter, true);
      loadInitialData();
    } catch (err) {
      setFlashError(err.response?.data?.message || 'Quantity update fail hui');
    }
  };

  // Toggle Counter
  const toggleCounterStatus = async (centerId, counterId, currentStatus) => {
    const order = ['active', 'break', 'closed'];
    const next = order[(order.indexOf(currentStatus) + 1) % order.length];
    try {
      await api.put(`/centers/${centerId}/counters/${counterId}`, { status: next });
      loadInitialData();
    } catch (err) {
      setFlashError('Counter status update fail hua');
    }
  };

  // Add Counter
  const addCounter = async (centerId) => {
    try {
      await api.post(`/centers/${centerId}/counters`, {});
      setFlashMessage('Naya counter add ho gaya!');
      loadInitialData();
    } catch (err) {
      setFlashError('Counter add nahi ho saka');
    }
  };

  // --- Combined Crowd & Waiting Time Prediction from Flask ---
  const handleCombinedForecast = async () => {
    if (!predictionDate) {
      setFlashError('Pehle Target Date select karein');
      return;
    }

    setForecastLoading(true);
    try {
      const selectedDateObj = new Date(predictionDate);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = days[selectedDateObj.getDay()];

      const payload = {
        Day: dayName,
        Slot_Time: selectedSlotTime,
        Crop: selectedCrop,
        Registered_farmers: queue.length > 0 ? queue.length : 25
      };

      const res = await axios.post(`${ML_API_BASE_URL}/predict-crowd-and-wait`, payload);
      setCrowdWaitResult(res.data);
      setFlashMessage(`Forecast Generated: ${res.data.predicted_waiting_time_minutes} mins wait time predicted.`);
    } catch (err) {
      setFlashError('Flask ML API response nahi de raha (Make sure port 5001 is running)');
    } finally {
      setForecastLoading(false);
    }
  };

  // --- MSP Price Prediction from Flask ---
  const handlePredictMSP = async (e) => {
    e.preventDefault();
    setMspLoading(true);
    try {
      const payload = {
        Crop_Name: mspForm.Crop_Name,
        Year: Number(mspForm.Year),
        Production_Cost: Number(mspForm.Production_Cost),
        'Demand_&_Supply': mspForm.Demand_Supply,
        Domestic_Market_Price: Number(mspForm.Domestic_Market_Price),
        Inflation_Rate: Number(mspForm.Inflation_Rate)
      };

      const res = await axios.post(`${ML_API_BASE_URL}/predict-msp`, payload);
      setPredictedMsp(res.data.predicted_msp);
      setFlashMessage(`Predicted MSP: ₹${res.data.predicted_msp.toFixed(2)}/Quintal`);
    } catch (err) {
      setFlashError('Flask ML Server se MSP predict nahi ho saka');
    } finally {
      setMspLoading(false);
    }
  };

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    return queue.filter((b) => {
      const matchesSearch =
        b.tokenNumber?.toString().includes(searchQuery) ||
        b.farmer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.farmer?.phone?.includes(searchQuery);

      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [queue, searchQuery, statusFilter]);

  const selectedCenterObj = centers.find((c) => c._id === selectedCenter);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16 font-sans antialiased">

      {/* Top Banner Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" /> Operations Command Centre
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
              Admin & Procurement Console
            </h1>
          </div>

          {/* Action Buttons & Mandi Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => navigate('/gate-scanner')}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Guard View</span>
              <span className="sm:hidden">Guard</span>
            </button>

            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Gate Scan</span>
            </button>

            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-500">Mandi:</span>
              <select
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                className="bg-transparent text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer max-w-[140px] sm:max-w-none truncate"
              >
                <option value="">Select Mandi</option>
                {centers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.district || c.location || 'Central'})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                loadQueue(selectedCenter);
                loadInitialData();
              }}
              title="Refresh Records"
              className="p-2 text-slate-600 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 rounded-xl transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-6 space-y-6 sm:space-y-8">

        {/* Flash Notifications */}
        {message && (
          <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-2xl flex items-center gap-2.5 shadow-xs animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold leading-normal">{message}</span>
          </div>
        )}
        {error && (
          <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-2xl flex items-center gap-2.5 shadow-xs animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold leading-normal">{error}</span>
          </div>
        )}

        {/* 4:1 TRIAGE DISPATCHER ACTION BANNER */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-400" />
              <span className="text-[11px] font-black tracking-widest uppercase text-amber-400">
                4:1 Triage Orchestrator
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-800 text-emerald-400 rounded-full border border-slate-700">
                {triageRatioStatus}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Interleaves 1 unbooked Standby Token (S-Series) smoothly after every 4 booked arrivals.
            </p>
            {activeTractorCall && (
              <div className="text-xs text-slate-200 pt-1">
                Now Serving at Verification: <strong className="text-amber-400 font-mono text-sm">#{activeTractorCall.tokenNumber}</strong> ({activeTractorCall.type === 'walk_in' ? 'Standby Triage' : 'Booked Slot'})
              </div>
            )}
          </div>

          <button
            onClick={handleDispatchNextTractor}
            disabled={dispatchLoading}
            className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {dispatchLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Truck className="w-4 h-4" />
            )}
            <span>Call Next Tractor 🚜</span>
          </button>
        </div>

        {/* Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">Total Farmers</span>
              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {summaryData?.totalBookings || summaryData?.overview?.totalFarmers || queue.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">Total registered tokens</div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">Active Queue</span>
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-600">
              {queue.filter((b) => b.status !== 'completed' && b.status !== 'missed').length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">Currently inside yard</div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">Procurement</span>
              <Wheat className="w-4 h-4 text-amber-600 shrink-0" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 truncate">
              {summaryData?.totalQuantityProcuredMT || summaryData?.overview?.totalProcuredMT || '3,456'} <span className="text-sm font-bold text-slate-500">MT</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">Weighed & dispatched</div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">Disbursed DBT</span>
              <IndianRupee className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 truncate">
              {summaryData?.formattedDisbursed || summaryData?.overview?.formattedDisbursed || '₹8.45 Cr'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">Bank transfers settled</div>
          </div>
        </div>

        {/* Counter Management Strip */}
        {selectedCenterObj && (
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 text-sm">Active Mandi Desks & Counters</h3>
                <span className="text-[11px] px-2 py-0.5 bg-slate-100 rounded-full font-semibold text-slate-600">
                  Avg. Turnaround: {selectedCenterObj.avgProcessingTimeMins || 20}m
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Toggle counter tags: Active → Break → Closed</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {selectedCenterObj.counters?.map((counter) => (
                <button
                  key={counter._id}
                  onClick={() => toggleCounterStatus(selectedCenter, counter._id, counter.status)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wide border transition-all cursor-pointer ${counter.status === 'active'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : counter.status === 'break'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-500 border-slate-300'
                    }`}
                >
                  {counter.name}: {counter.status}
                </button>
              ))}
              <button
                onClick={() => addCounter(selectedCenter)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Add Counter
              </button>
            </div>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'queue', label: 'Live Queue Table', icon: <Layers className="w-4 h-4" /> },
            { id: 'slots', label: 'Slot Scheduler', icon: <Calendar className="w-4 h-4" /> },
            { id: 'centers', label: 'Centres Setup', icon: <Building2 className="w-4 h-4" /> },
            { id: 'ai', label: 'AI Footfall & MSP Engine', icon: <Sparkles className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-200'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: LIVE QUEUE PIPELINE */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Token #, Name, Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Stages ({queue.length})</option>
                  <option value="booked">Booked (Waiting Check-in)</option>
                  <option value="arrived">Arrived at Gate</option>
                  <option value="verification">Verification</option>
                  <option value="weighing">Weighing</option>
                  <option value="quality_check">Quality Check</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 text-slate-400 text-sm flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Syncing live queue...</span>
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500 text-sm">
                No matching farmer records in this mandi queue.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
                {filteredQueue.map((b) => {
                  const next = nextStage(b.status);
                  const statusPill = STAGE_CONFIG[b.status] || STAGE_CONFIG.booked;
                  const isWalkIn = b.bookingType === 'walk_in' || (b.tokenNumber && b.tokenNumber.toString().startsWith('S-'));

                  return (
                    <div
                      key={b._id}
                      className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                            Token #{b.tokenNumber}
                          </span>

                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${isWalkIn ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900 border border-blue-200'
                            }`}>
                            {isWalkIn ? 'Walk-In (STB)' : 'Advance (REG)'}
                          </span>

                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusPill.color}`}>
                            {statusPill.label}
                          </span>

                          {b.paymentStatus === 'paid' && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Paid ₹{b.amountPaid?.toLocaleString('en-IN') || ''}
                            </span>
                          )}
                        </div>

                        <div className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
                          {b.farmer?.name || 'Registered Farmer'} · <span className="text-slate-500 font-normal">{b.farmer?.phone}</span>
                        </div>

                        <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                          <span>Slot: {b.slot?.timeSlot || 'Spot Entry'}</span>
                          <span>•</span>
                          <span>Crop: <strong>{b.cropType || 'Wheat'}</strong></span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-purple-700 font-semibold">
                            <Timer className="w-3 h-3" /> Live Wait: {b.etaMinutes != null ? `${b.etaMinutes} mins` : '30-40 mins'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap pt-2 lg:pt-0">
                        {b.status === 'booked' && (
                          <button
                            onClick={() => checkInBooking(b._id)}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" /> Gate Check-in
                          </button>
                        )}
                        {(b.status === 'booked' || b.status === 'arrived') && (
                          <button
                            onClick={async () => {
                              const reason = prompt("Tractor reject karne ka reason dalein:");
                              if (!reason) return;
                              try {
                                await api.put(`/bookings/${b._id}/status`, { status: 'missed', rejectionReason: reason });
                                setFlashMessage('Tractor entry reject kar di gayi hai.');
                                loadQueue(selectedCenter, true);
                              } catch (err) {
                                setFlashError('Rejection update fail ho gaya');
                              }
                            }}
                            className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        )}
                        {b.status === 'verification' && (
                          <button
                            onClick={() => setSelectedBookingForWeighbridge(b)}
                            className="px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            <span>Record Weight ⚖️</span>
                          </button>
                        )}

                        {next && b.status !== 'booked' && (
                          <button
                            onClick={() => advanceStage(b._id, b.status)}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span>Move to {STAGE_CONFIG[next]?.label || next}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                          <input
                            type="number"
                            placeholder="Qty"
                            value={quantitiesDraft[b._id] ?? ''}
                            onChange={(e) =>
                              setQuantitiesDraft({ ...quantitiesDraft, [b._id]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveQuantity(b._id);
                            }}
                            onBlur={() => saveQuantity(b._id)}
                            className="w-14 sm:w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <span className="text-[10px] font-bold text-slate-500 pr-1">QTL</span>
                        </div>

                        {b.paymentStatus !== 'paid' && (
                          <button
                            onClick={() => markPaid(b._id, b.farmer?.name)}
                            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <IndianRupee className="w-3.5 h-3.5" /> Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SLOT SCHEDULER */}
        {activeTab === 'slots' && (
          <div className="max-w-xl mx-auto bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4 sm:space-y-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Procurement Slot Management</h2>
              <p className="text-xs text-slate-500 mt-0.5">Schedule hourly arrival quotas to prevent yard congestion.</p>
            </div>

            <form onSubmit={createSlot} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target Mandi</label>
                <select
                  value={slotForm.center}
                  onChange={(e) => setSlotForm({ ...slotForm, center: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Select a centre</option>
                  {centers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.district || c.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={slotForm.date}
                  onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Time Window</label>
                  <input
                    placeholder="e.g. 09:00 AM - 10:00 AM"
                    value={slotForm.timeSlot}
                    onChange={(e) => setSlotForm({ ...slotForm, timeSlot: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Capacity</label>
                  <input
                    type="number"
                    value={slotForm.capacity}
                    onChange={(e) => setSlotForm({ ...slotForm, capacity: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-200 cursor-pointer"
                >
                  Publish Single Slot
                </button>
                <button
                  type="button"
                  onClick={handleGenerateDailySlots}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>1-Click Full Day (9-5)</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: REGISTER NEW CENTRE */}
        {activeTab === 'centers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Add Procurement Centre</h2>
              <p className="text-xs text-slate-500">Register new APMC market yards with accurate district geo-tags.</p>

              <form onSubmit={createCenter} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Centre Name</label>
                  <input
                    value={centerForm.name}
                    onChange={(e) => setCenterForm({ ...centerForm, name: e.target.value })}
                    placeholder="e.g. Jehanabad Mandi Yard #1"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">District</label>
                  <input
                    value={centerForm.district}
                    onChange={(e) => setCenterForm({ ...centerForm, district: e.target.value })}
                    placeholder="e.g. Jehanabad, Patna, Gaya"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Location Address</label>
                  <input
                    value={centerForm.location}
                    onChange={(e) => setCenterForm({ ...centerForm, location: e.target.value })}
                    placeholder="e.g. Near Railway Cargo Gate"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-200 cursor-pointer"
                >
                  Save Mandi Centre
                </button>
              </form>
            </div>

            <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Registered Mandi Centres</h2>
              <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                {centers.map((c) => (
                  <div key={c._id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">{c.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{c.district} · {c.location}</div>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-1 bg-slate-100 text-slate-700 rounded-lg shrink-0">
                      {c.counters?.length || 0} Desks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FLASK AI & ML PREDICTIONS (WAITING TIME + MSP) */}
        {activeTab === 'ai' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* 1. Combined Crowd & Waiting Time Prediction Card */}
            <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Mandi Crowd & Wait Predictor</h2>
                  <p className="text-xs text-slate-500">Live Scikit-learn regression using historical slot & crowd metrics.</p>
                </div>
              </div>

              <div className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target Date</label>
                  <input
                    type="date"
                    value={predictionDate}
                    onChange={(e) => setPredictionDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Slot Window</label>
                    <select
                      value={selectedSlotTime}
                      onChange={(e) => setSelectedSlotTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    >
                      <option value="09:00-11:00">09:00 - 11:00 AM</option>
                      <option value="11:00-01:00">11:00 - 01:00 PM</option>
                      <option value="02:00-04:00">02:00 - 04:00 PM</option>
                      <option value="04:00-06:00">04:00 - 06:00 PM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target Crop</label>
                    <select
                      value={selectedCrop}
                      onChange={(e) => setSelectedCrop(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    >
                      <option value="Wheat">Wheat (गेहूँ)</option>
                      <option value="Paddy">Paddy (धान)</option>
                      <option value="Gram">Gram (चना)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div><strong>Yard Token Queue:</strong> {queue.length || 25} Registered</div>
                  <div><strong>API Engine:</strong> /predict-crowd-and-wait (Scikit-learn)</div>
                </div>

                <button
                  onClick={handleCombinedForecast}
                  disabled={forecastLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {forecastLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Timer className="w-4 h-4" />}
                  <span>Predict Influx & Waiting Time</span>
                </button>
              </div>

              {crowdWaitResult && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-indigo-100">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Expected Footfall</span>
                      <span className="text-2xl font-black text-slate-900 font-mono">
                        ~{crowdWaitResult.predicted_crowd_farmers} Tractors
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-indigo-100">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Est. Waiting Time</span>
                      <span className="text-2xl font-black text-indigo-700 font-mono">
                        {crowdWaitResult.predicted_waiting_time_minutes} Mins
                      </span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl text-xs font-medium border ${
                    crowdWaitResult.rush_level === 'HIGH'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : crowdWaitResult.rush_level === 'MODERATE'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    <strong>Rush Alert ({crowdWaitResult.rush_level}):</strong> {crowdWaitResult.recommendation}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Crop MSP Pricing Forecast Engine */}
            <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Crop MSP Pricing Model</h2>
                  <p className="text-xs text-slate-500">Government MSP projection engine based on economic factors.</p>
                </div>
              </div>

              <form onSubmit={handlePredictMSP} className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Crop</label>
                    <select
                      value={mspForm.Crop_Name}
                      onChange={(e) => setMspForm({ ...mspForm, Crop_Name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="Wheat">Wheat</option>
                      <option value="Paddy">Paddy</option>
                      <option value="Gram">Gram</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Year</label>
                    <input
                      type="number"
                      value={mspForm.Year}
                      onChange={(e) => setMspForm({ ...mspForm, Year: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Production Cost</label>
                    <input
                      type="number"
                      value={mspForm.Production_Cost}
                      onChange={(e) => setMspForm({ ...mspForm, Production_Cost: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Demand/Supply</label>
                    <select
                      value={mspForm.Demand_Supply}
                      onChange={(e) => setMspForm({ ...mspForm, Demand_Supply: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Market Price (₹)</label>
                    <input
                      type="number"
                      value={mspForm.Domestic_Market_Price}
                      onChange={(e) => setMspForm({ ...mspForm, Domestic_Market_Price: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Inflation Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={mspForm.Inflation_Rate}
                      onChange={(e) => setMspForm({ ...mspForm, Inflation_Rate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={mspLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {mspLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                  <span>Forecast Fair MSP Rate</span>
                </button>
              </form>

              {predictedMsp !== null && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5 animate-fadeIn">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Predicted Government MSP</span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
                    ₹{predictedMsp.toFixed(2)} <span className="text-sm font-bold text-slate-500">/ Quintal</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Built-in Gate Camera Modal */}
      <GateScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={() => {
          loadQueue(selectedCenter, true);
          loadInitialData();
        }}
      />

      {/* Built-in Weighbridge & Anti-Arbitrage Quota Modal */}
      <WeighbridgeModal
        isOpen={Boolean(selectedBookingForWeighbridge)}
        booking={selectedBookingForWeighbridge}
        onClose={() => setSelectedBookingForWeighbridge(null)}
        onSuccess={() => {
          setFlashMessage('Weighment saved & seasonal land quota updated successfully!');
          loadQueue(selectedCenter, true);
          loadInitialData();
        }}
      />

    </div>
  );
}