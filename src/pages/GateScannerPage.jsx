import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ArrowLeft, 
  Flashlight, 
  RotateCcw, 
  Keyboard,
  ShieldCheck,
  Phone,
  User,
  Ticket,
  MapPin,
  UserPlus,
  X,
  Navigation,
  Check
} from 'lucide-react';
import api from '../api/api';

export default function GateScannerPage() {
  const [scanResult, setScanResult] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [manualInputOpen, setManualInputOpen] = useState(false);
  const [manualToken, setManualToken] = useState('');

  // Spot Walk-in State
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInLoading, setWalkInLoading] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInMobile, setWalkInMobile] = useState('');
  const [walkInCrop, setWalkInCrop] = useState('Wheat');
  const [centerId, setCenterId] = useState('');
  const [centerName, setCenterName] = useState('');

  // 🟢 OPERATOR GPS CALIBRATION STATES
  const [calibratingGps, setCalibratingGps] = useState(false);
  const [gpsCalibratedCoords, setGpsCalibratedCoords] = useState(null);
  const [gpsStatusMsg, setGpsStatusMsg] = useState('');

  const scannerRef = useRef(null);
  const isProcessingRef = useRef(false);
  const navigate = useNavigate();

  // Load staff center context
  useEffect(() => {
    const fetchDefaultCenter = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser.center) {
          setCenterId(storedUser.center);
        }
        
        const res = await api.get('/centers');
        if (res.data?.length > 0) {
          const defaultCenter = storedUser.center 
            ? res.data.find(c => c._id === storedUser.center) || res.data[0]
            : res.data[0];

          setCenterId(defaultCenter._id);
          setCenterName(defaultCenter.name);
          if (defaultCenter.coordinates) {
            setGpsCalibratedCoords(defaultCenter.coordinates);
          }
        }
      } catch (err) {
        console.error('Failed to resolve center ID', err);
      }
    };
    fetchDefaultCenter();
  }, []);

  // 🟢 Operator GPS Calibration Function
  const handleCalibrateGateGps = () => {
    if (!navigator.geolocation) {
      alert('Aapka browser ya device GPS support nahi karta.');
      return;
    }

    if (!centerId) {
      alert('Mandi Center ID resolve nahi hui. Kripya page refresh karein.');
      return;
    }

    setCalibratingGps(true);
    setGpsStatusMsg('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await api.put(`/centers/${centerId}/calibrate-gate-gps`, {
            lat: latitude,
            lng: longitude,
            radiusMeters: 800
          });

          setGpsCalibratedCoords(res.data.coordinates || { lat: latitude, lng: longitude });
          setGpsStatusMsg(`✅ Gate GPS Locked: [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`);
        } catch (err) {
          console.error('GPS calibration error:', err);
          setGpsStatusMsg('❌ Calibration failed. Check permissions.');
        } finally {
          setCalibratingGps(false);
        }
      },
      (err) => {
        setCalibratingGps(false);
        alert('Kripya Operator device par GPS location allow karein!');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {}
  };

  const stopCamera = useCallback(async () => {
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
    setErrorDetails(null);

    try {
      let bookingId = qrData;
      try {
        const parsed = JSON.parse(qrData);
        bookingId = parsed.bookingId || parsed._id || qrData;
      } catch (e) {}

      const res = await api.post(`/bookings/checkin/${bookingId}`);
      playBeep();
      setScanResult(res.data);
    } catch (err) {
      const data = err.response?.data;
      setErrorDetails({
        message: data?.message || 'Check-in failed! Invalid ticket QR.',
        tokenNumber: data?.tokenNumber,
        farmerName: data?.farmerName,
        farmerPhone: data?.farmerPhone || data?.phone,
        assignedCounter: data?.assignedCounter || 'Counter 1 (Verification)'
      });
    } finally {
      setLoading(false);
    }
  };

  const startCamera = useCallback(async () => {
    await stopCamera();
    setScanResult(null);
    setErrorDetails(null);
    setIsTorchOn(false);
    isProcessingRef.current = false;

    setTimeout(async () => {
      const element = document.getElementById('qr-camera-viewport');
      if (!element) return;

      const html5Qr = new Html5Qrcode('qr-camera-viewport');
      scannerRef.current = html5Qr;

      try {
        await html5Qr.start(
          { facingMode: 'environment' },
          { 
            fps: 15, 
            qrbox: (w, h) => {
              const size = Math.floor(Math.min(w, h) * 0.72);
              return { width: size, height: size };
            },
            aspectRatio: 1.0 
          },
          async (decodedText) => {
            if (!isProcessingRef.current) {
              await stopCamera();
              handleGateCheckIn(decodedText);
            }
          },
          () => {}
        );

        try {
          const capabilities = html5Qr.getRunningTrackCapabilities();
          if (capabilities?.torch) setTorchAvailable(true);
        } catch (e) {
          setTorchAvailable(false);
        }
      } catch (err) {
        setErrorDetails({
          message: 'Camera permission allow karein ya ensure karein lens clean ho.'
        });
      }
    }, 200);
  }, [stopCamera]);

  const toggleTorch = async () => {
    if (scannerRef.current && torchAvailable) {
      try {
        const newState = !isTorchOn;
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: newState }]
        });
        setIsTorchOn(newState);
      } catch (e) {
        console.warn('Torch failed', e);
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleGateCheckIn(manualToken.trim());
    setManualToken('');
    setManualInputOpen(false);
  };

  // Spot Walk-in Submit Handler
  const handleSpotWalkInSubmit = async (e) => {
    e.preventDefault();
    if (!walkInMobile || walkInMobile.trim().length !== 10) {
      alert('Kripya 10-digit valid mobile number enter karein');
      return;
    }

    setWalkInLoading(true);
    try {
      const res = await api.post('/bookings/walk-in-entry', {
        centerId,
        farmerName: walkInName.trim() || 'Spot Farmer',
        mobile: walkInMobile.trim(),
        cropType: walkInCrop
      });

      playBeep();
      setWalkInModalOpen(false);
      setWalkInName('');
      setWalkInMobile('');

      setScanResult({
        message: 'On-Spot Standby Token Issued (S-Series)',
        tokenNumber: res.data.tokenNumber,
        farmerName: walkInName.trim() || 'Spot Farmer',
        phone: walkInMobile.trim()
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Spot token generation failed');
    } finally {
      setWalkInLoading(false);
    }
  };

  useEffect(() => {
    if (!walkInModalOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera, walkInModalOpen]);

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-white flex flex-col font-sans antialiased">
      
      {/* Top Header Bar */}
      <header className="px-4 py-3 sm:py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors py-1 px-2.5 rounded-xl hover:bg-slate-800 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Console</span>
        </button>

        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs sm:text-sm font-black tracking-tight">
            Gate Entry Scanner
          </span>
        </div>

        <div className="flex items-center gap-2">
          {torchAvailable && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${
                isTorchOn
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Flashlight"
            >
              <Flashlight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setManualInputOpen(!manualInputOpen)}
            className={`p-2 rounded-xl text-xs transition-colors cursor-pointer ${
              manualInputOpen ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Manual Token Entry"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 max-w-md mx-auto w-full space-y-3.5">
        
        {/* 🟢 OPERATOR GATE GPS CALIBRATOR STRIP */}
        <div className="w-full bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-wide">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gate Geofence Authority</span>
            </div>
            {centerName && (
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold truncate max-w-[130px]">
                {centerName}
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-tight">
            Mandi Gate par khade hokar button dabayein taaki yahan ki exact location lock ho aur kisano ka pass unblur ho sake.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCalibrateGateGps}
              disabled={calibratingGps}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${calibratingGps ? 'animate-spin' : ''}`} />
              <span>{calibratingGps ? 'Locking Gate GPS...' : 'Set Gate GPS From My Device'}</span>
            </button>

            {gpsCalibratedCoords && (
              <div className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-emerald-400 font-mono flex items-center gap-1 shrink-0" title="Active Mandi Gate Coordinates">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>{gpsCalibratedCoords.lat.toFixed(2)}, {gpsCalibratedCoords.lng.toFixed(2)}</span>
              </div>
            )}
          </div>

          {gpsStatusMsg && (
            <div className="text-[10px] text-emerald-300 font-semibold text-center pt-0.5 animate-fadeIn">
              {gpsStatusMsg}
            </div>
          )}
        </div>

        {/* On-Spot Walk-In Action Button */}
        <button
          onClick={() => setWalkInModalOpen(true)}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-[0.98] text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 transition-all border border-amber-400/30 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Bina Booking Kisan Entry (Issue S-Token)</span>
        </button>

        {/* Manual Fallback Input */}
        {manualInputOpen && (
          <form 
            onSubmit={handleManualSubmit}
            className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 shadow-xl animate-fadeIn"
          >
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Booking ID or Ticket QR Text
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste ID here..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Verify
              </button>
            </div>
          </form>
        )}

        {/* Viewfinder Camera Box */}
        {!scanResult && !errorDetails && !walkInModalOpen && (
          <div className="w-full max-w-[340px] aspect-square relative bg-slate-900 rounded-3xl overflow-hidden border-2 border-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.15)] flex items-center justify-center">
            <div id="qr-camera-viewport" className="w-full h-full object-cover" />

            <div className="absolute inset-8 pointer-events-none rounded-2xl">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400 -mt-0.5 -ml-0.5" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400 -mt-0.5 -mr-0.5" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400 -mb-0.5 -ml-0.5" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400 -mb-0.5 -mr-0.5" />
            </div>

            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-400 shadow-[0_0_15px_#10b981] animate-pulse pointer-events-none" />

            {loading && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-2.5">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Verifying Gate Pass...
                </span>
              </div>
            )}
          </div>
        )}

        {/* 1. SUCCESS STATE */}
        {scanResult && (
          <div className="w-full bg-white text-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-fadeIn">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {scanResult.message || 'Gate Entry Approved'}
              </span>
              <h2 className="text-4xl font-black text-slate-900 pt-1 font-mono">
                Token #{scanResult.tokenNumber}
              </h2>
            </div>

            <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 text-xs text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Farmer:
                </span>
                <span className="font-bold text-slate-900 truncate max-w-[180px]">
                  {scanResult.farmerName || 'Registered Farmer'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone:
                </span>
                <span className="font-bold text-slate-900">
                  {scanResult.phone || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Assigned Desk:
                </span>
                <span className="font-bold text-emerald-700">
                  Counter 1 (Verification)
                </span>
              </div>
            </div>

            <button
              onClick={startCamera}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Scan Next Farmer</span>
            </button>
          </div>
        )}

        {/* 2. WARNING/ERROR STATE */}
        {errorDetails && (
          <div className="w-full bg-slate-900 border border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-left">
                <h4 className="font-bold text-sm text-white leading-tight">
                  {errorDetails.message}
                </h4>
                <p className="text-xs text-slate-400">
                  Kisan ka token pehle hi verify ho chuka hai ya ticket status update ho gaya hai.
                </p>
              </div>
            </div>

            {(errorDetails.farmerName || errorDetails.tokenNumber) && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-xs space-y-2 text-left">
                {errorDetails.tokenNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-amber-400" /> Token:
                    </span>
                    <span className="font-bold text-amber-400 text-sm font-mono">#{errorDetails.tokenNumber}</span>
                  </div>
                )}
                {errorDetails.farmerName && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Farmer:
                    </span>
                    <span className="font-semibold text-slate-200">{errorDetails.farmerName}</span>
                  </div>
                )}
                {errorDetails.farmerPhone && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone:
                    </span>
                    <span className="font-semibold text-slate-200">{errorDetails.farmerPhone}</span>
                  </div>
                )}
                {errorDetails.assignedCounter && (
                  <div className="flex justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Current Desk:</span>
                    <span className="font-bold text-emerald-400">{errorDetails.assignedCounter}</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={startCamera}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Scan Next Farmer</span>
            </button>
          </div>
        )}

        <p className="text-[11px] text-slate-500 text-center px-4 leading-normal">
          Farmer ke mobile screen par मौजूद <strong>Digital Gate Pass QR</strong> ko frame ke andar scan karein.
        </p>
      </main>

      {/* 3. MODAL: SPOT WALK-IN TOKEN GENERATOR */}
      {walkInModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Ticket className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">Issue Standby Token (S-Series)</h3>
              </div>
              <button 
                onClick={() => setWalkInModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Bina slot aaye kisan ko 4:1 priority queue me standby ticket assign karein.
            </p>

            <form onSubmit={handleSpotWalkInSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Kisan Ka Naam
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  10-Digit Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={walkInMobile}
                  onChange={(e) => setWalkInMobile(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Fasal (Crop)
                </label>
                <select
                  value={walkInCrop}
                  onChange={(e) => setWalkInCrop(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Wheat">Gehu (Wheat)</option>
                  <option value="Paddy">Dhan (Paddy)</option>
                  <option value="Mustard">Sarson (Mustard)</option>
                  <option value="Chana">Chana (Gram)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWalkInModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walkInLoading}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {walkInLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Issue S-Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}