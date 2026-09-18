import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Search,
  ChevronRight,
  AlertCircle,
  Wheat,
  Users
} from 'lucide-react';
import api from '../api/api';
import VoiceSlotAssistant from './VoiceSlotAssistant';

const CROPS = ['Wheat (Gehu)', 'Paddy (Dhan)', 'Mustard (Sarson)', 'Soybean', 'Gram (Chana)'];

// Timezone-safe local YYYY-MM-DD formatter
function formatLocalDate(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function BookSlot() {
  const [step, setStep] = useState(1); // 1: Select Centre, 2: Select Date, Crop & Slot, 3: Confirmation
  const [centers, setCenters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState(null);

  const [date, setDate] = useState('');
  const [cropType, setCropType] = useState('Wheat (Gehu)');
  const [slots, setSlots] = useState([]);
  const [recommendedIds, setRecommendedIds] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [bookingResult, setBookingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [centersLoading, setCentersLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate(); // 🟢 Fixed: Hook moved to the top level of the component

  const handleVoiceAutoFill = (parsedData) => {
    if (parsedData.cropType) {
      setCropType(parsedData.cropType);
    }
    if (parsedData.date) {
      setDate(parsedData.date);
    }
    if (parsedData.center) {
      setSelectedCenter(parsedData.center);
      setStep(2); // Auto jump to Step 2
    }
  };

  // 1. Load Mandi Centres
  useEffect(() => {
    setCentersLoading(true);
    api.get('/centers')
      .then((res) => {
        setCenters(res.data || []);
      })
      .catch(() => setError('Unable to load procurement centres.'))
      .finally(() => setCentersLoading(false));
  }, []);

  // 2. Safe local calendar dates generator (next 5 days)
  const availableDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = formatLocalDate(d);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      dates.push({ iso, dayName, dayNum, monthName });
    }
    return dates;
  }, []);

  // Set default starting date
  useEffect(() => {
    if (availableDates.length > 0 && !date) {
      setDate(availableDates[0].iso);
    }
  }, [availableDates, date]);

  // 3. Load Slots & Recommendations on Center/Date Change
  useEffect(() => {
    if (!selectedCenter || !date) return;

    const loadSlots = async () => {
      setError('');
      setLoading(true);
      setSelectedSlot(null);

      try {
        const [slotsRes, recRes] = await Promise.all([
          api.get('/slots', { params: { centerId: selectedCenter._id, date } }),
          api.get('/slots/recommended', { params: { centerId: selectedCenter._id, date } }).catch(() => ({ data: [] }))
        ]);

        const loadedSlots = slotsRes.data || [];
        const recList = recRes.data || [];
        const recIds = recList.map((s) => s._id);

        setSlots(loadedSlots);
        setRecommendedIds(recIds);

        // Auto-select first recommended slot if free
        if (recList.length > 0 && recList[0].bookedCount < recList[0].capacity) {
          setSelectedSlot(recList[0]);
        }
      } catch (err) {
        setError('Could not load slots for the chosen date.');
      } finally {
        setLoading(false);
      }
    };

    loadSlots();
  }, [selectedCenter, date]);

  // 4. Confirm Slot Booking Trigger
  const handleBookSlot = async () => {
    if (!selectedSlot) return;
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/bookings', {
        slotId: selectedSlot._id,
        cropType: cropType.split(' ')[0] // e.g. "Wheat"
      });

      setBookingResult({
        tokenNumber: res.data.tokenNumber || res.data.booking?.tokenNumber || '125',
        centerName: selectedCenter.name,
        district: selectedCenter.district || 'Central District',
        date,
        timeSlot: selectedSlot.timeSlot,
        cropType
      });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Slot booking failed. Please try another slot.');
    } finally {
      setLoading(false);
    }
  };

  // Filter Centers by name or district
  const filteredCenters = centers.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">

        {/* Navigation & Step Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              if (step === 2) setStep(1);
              else navigate(-1);
            }}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 2 ? 'Change Centre' : 'Back'}
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full">
            {step === 1 && 'Step 1 of 2: Mandi Selection'}
            {step === 2 && 'Step 2 of 2: Date & Crop Details'}
            {step === 3 && 'Booking Confirmed'}
          </span>
        </div>

        {/* Voice AI Assistant Strip */}
        {step < 3 && (
          <VoiceSlotAssistant
            centers={centers}
            onAutoFill={handleVoiceAutoFill}
          />
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: CHOOSE MANDI CENTRE */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Select Procurement Centre</h1>
              <p className="text-sm text-slate-500 mt-1">Choose a nearby mandi to check current rush and wait times.</p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by mandi name, district, or town..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
              />
            </div>

            {/* Mandi Cards List */}
            <div className="space-y-3 pt-2">
              {centersLoading ? (
                <div className="text-center py-12 text-sm text-slate-500">Loading procurement centres...</div>
              ) : filteredCenters.map((c) => (
                <div
                  key={c._id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between cursor-pointer group"
                  onClick={() => {
                    setSelectedCenter(c);
                    setStep(2);
                  }}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {c.name}
                      </h3>
                      {c.isRecommended && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Recommended (Low Rush)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {c.district ? `${c.district} · ` : ''}{c.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        Avg. Wait: {c.estimatedWaitTime || `${c.avgProcessingTimeMins || 30} mins`}
                      </span>
                      {c.currentQueueCount !== undefined && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          Queue: {c.currentQueueCount} farmers
                        </span>
                      )}
                    </div>
                  </div>

                  <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shadow-sm">
                    <span>Select</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {!centersLoading && filteredCenters.length === 0 && (
                <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
                  Koi procurement centre match nahi hua. Search query check karein.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: SELECT DATE, CROP & TIME SLOT */}
        {step === 2 && (
          <div className="space-y-6">

            {/* Selected Mandi Indicator */}
            <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Selected Mandi</span>
                <h2 className="text-base font-bold text-slate-900">{selectedCenter?.name}</h2>
                <div className="text-xs text-slate-500 mt-0.5">{selectedCenter?.district} · {selectedCenter?.location}</div>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-xs font-bold text-emerald-700 underline hover:text-emerald-800"
              >
                Change Mandi
              </button>
            </div>

            {/* Crop Selection Strip */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select Crop Category
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {CROPS.map((crop) => (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => setCropType(crop)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${cropType === crop
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    {crop}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Pill Strip */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select Arrival Date
              </label>
              <div className="grid grid-cols-5 gap-2">
                {availableDates.map((d) => {
                  const isSelected = date === d.iso;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => setDate(d.iso)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                        }`}
                    >
                      <span className="text-[11px] font-medium opacity-80">{d.dayName}</span>
                      <span className="text-lg font-black">{d.dayNum}</span>
                      <span className="text-[10px] uppercase font-semibold">{d.monthName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Recommendation Banner */}
            {recommendedIds.length > 0 && (
              <div className="p-3.5 bg-emerald-100/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>AI Recommendation:</strong> "Low Rush" slots have faster weighbridge turnaround and minimum wait time.
                </span>
              </div>
            )}

            {/* Slots Grid */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                Available Hourly Slots
              </label>

              {loading ? (
                <div className="text-center py-8 text-sm text-slate-500">Checking mandi slot availability...</div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-2xl border border-slate-200 text-sm text-slate-500">
                  Is date ke liye koi slot open nahi hai. Kripya dusri date chunein.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {slots.map((s) => {
                    const isFull = s.bookedCount >= s.capacity;
                    const isRec = recommendedIds.includes(s._id);
                    const isSelected = selectedSlot?._id === s._id;

                    return (
                      <div
                        key={s._id}
                        onClick={() => !isFull && setSelectedSlot(s)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer relative ${isFull
                          ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                          : isSelected
                            ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-emerald-300 shadow-sm'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">{s.timeSlot}</span>
                          {isRec && !isFull && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              Low Rush
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
                          <span>{s.bookedCount} / {s.capacity} booked</span>
                          <span className={isFull ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                            {isFull ? 'Full' : 'Available'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confirm Slot Button */}
            <button
              onClick={handleBookSlot}
              disabled={!selectedSlot || loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Confirming Your Slot...' : 'Confirm Mandi Slot'}
            </button>
          </div>
        )}

        {/* STEP 3: BOOKING CONFIRMATION */}
        {step === 3 && bookingResult && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">Booking Confirmed!</h2>
              <p className="text-sm text-slate-500 mt-1">Your slot has been successfully booked with MSP assurance.</p>
            </div>

            {/* Token Badge */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 max-w-sm mx-auto">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Your Mandi Token</span>
              <div className="text-5xl font-black text-emerald-700 tracking-tight mt-1">
                #{bookingResult.tokenNumber}
              </div>
            </div>

            {/* Booking Details Summary */}
            <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100 text-sm max-w-sm mx-auto text-left bg-slate-50/50">
              <div className="py-2.5 px-4 flex justify-between">
                <span className="text-slate-500">Mandi Centre:</span>
                <span className="font-bold text-slate-800">{bookingResult.centerName}</span>
              </div>
              <div className="py-2.5 px-4 flex justify-between">
                <span className="text-slate-500">Crop:</span>
                <span className="font-bold text-slate-800">{bookingResult.cropType}</span>
              </div>
              <div className="py-2.5 px-4 flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold text-slate-800">{bookingResult.date}</span>
              </div>
              <div className="py-2.5 px-4 flex justify-between">
                <span className="text-slate-500">Scheduled Window:</span>
                <span className="font-bold text-slate-800">{bookingResult.timeSlot}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => navigate('/my-bookings')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-200 transition-all"
              >
                Track Live Queue Status
              </button>
              <button
                onClick={() => {
                  setStep(1);
                  setSelectedCenter(null);
                  setSelectedSlot(null);
                  setBookingResult(null);
                }}
                className="w-full py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all"
              >
                Book Another Slot
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}