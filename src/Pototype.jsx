import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Sparkles, Loader2, Cpu, Activity, ShieldCheck, Calendar, DollarSign, ArrowRight, RefreshCw, MapPin } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Prototype() {
    // Real Data States
    const [realData, setRealData] = useState({
        totalFarmers: 1420,
        totalMT: '5,840.5 MT',
        formattedDBT: '₹1.34 Cr',
        activeInYard: 28,
        avgTurnaround: 22,
        centers: [
            { _id: '1', name: 'Patna Central Mandi Yard #1', location: 'Cargo Gate Bypass', wait: '18 mins' },
            { _id: '2', name: 'Jehanabad APMC Hub', location: 'Toll Bypass', wait: '24 mins' }
        ]
    });

    // AI Predictor Form States
    const [aiForm, setAiForm] = useState({
        Crop_Name: 'Wheat',
        Production_Cost: 1720,
        DemandSupply: 'High',
        Domestic_Market_Price: 2350,
        Inflation_Rate: 4.8
    });
    const [predictedPrice, setPredictedPrice] = useState(null);
    const [loadingAi, setLoadingAi] = useState(false);

    // Chart States
    const [chartData, setChartData] = useState(null);
    const [loadingChart, setLoadingChart] = useState(true);
    const [selectedCrop, setSelectedCrop] = useState("Wheat");

    // Fetch Trend Data simulation matching backend /price-trends
    useEffect(() => {
        setLoadingChart(true);
        // Simulated fetch to match Python Flask endpoint response structure
        setTimeout(() => {
            const historicalYears = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
            const samplePrices = selectedCrop === "Wheat" 
                ? [1525, 1625, 1735, 1840, 1925, 1975, 2015, 2125, 2425, 2585, 2660, 2740, 2820, 2910, 3000]
                : [1470, 1550, 1750, 1815, 1868, 1940, 2040, 2183, 2300, 2369, 2440, 2510, 2590, 2670, 2750];

            setChartData({
                labels: historicalYears,
                datasets: [
                    {
                        label: `${selectedCrop} Price Trend & Forecast (₹)`,
                        data: samplePrices,
                        borderColor: "#059669",
                        backgroundColor: "rgba(5, 150, 105, 0.1)",
                        borderWidth: 3,
                        pointBackgroundColor: "#10b981",
                        pointBorderColor: "#ffffff",
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        tension: 0.2,
                        fill: true,
                    },
                ],
            });
            setLoadingChart(false);
        }, 400);
    }, [selectedCrop]);

    const handlePredictPrice = async (e) => {
        e.preventDefault();
        setLoadingAi(true);
        setTimeout(() => {
            // Simulated RF model response
            const base = aiForm.Production_Cost * 1.15;
            setPredictedPrice(Math.round(base + (aiForm.Inflation_Rate * 15)));
            setLoadingAi(false);
        }, 500);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
            {/* Top Govt Trust Banner */}
            <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 border-b border-slate-800">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-semibold text-white">SmartMandi Unified Procurement Network</span>
                        <span className="hidden sm:inline text-slate-500">|</span>
                        <span className="hidden sm:inline text-slate-400">APMC Yard Logistics & Direct DBT Settlements</span>
                    </div>
                    <div className="text-emerald-400 font-bold">● System Online</div>
                </div>
            </div>

            {/* Navigation */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-xs">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-xl font-black tracking-tight text-slate-900">
                                Smart<span className="text-emerald-600">Mandi</span>
                            </span>
                            <span className="block text-[9px] font-bold text-slate-400 -mt-1 tracking-wider uppercase">
                                Digital APMC Prototype
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                            Flask + MongoDB + React
                        </span>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
                
                {/* HERO SECTION */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-gradient-to-br from-emerald-50/60 via-white to-slate-50 p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xs">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-7 space-y-4"
                    >
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4 text-emerald-700" /> 
                            <span>Queue & Settlement Protocol</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                            Smart Mandi Queue & <span className="text-emerald-600">Direct DBT Payout</span>
                        </h1>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                            Eliminating highway congestion with real-time yard telemetry, non-linear Random Forest price forecasting, and automated electronic weighbridge ticketing.
                        </p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="lg:col-span-5 bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4"
                    >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Live Yard Status</span>
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-mono font-bold">ACTIVE</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-2xl sm:text-3xl font-black text-white">{realData.activeInYard}</div>
                                <div className="text-xs text-slate-400">Tractors in Queue</div>
                            </div>
                            <div>
                                <div className="text-2xl sm:text-3xl font-black text-emerald-400">&lt; {realData.avgTurnaround}m</div>
                                <div className="text-xs text-slate-400">Avg Turnaround</div>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* REAL-TIME PULSE STRIP */}
                <section className="bg-emerald-900 text-white py-6 px-6 rounded-2xl shadow-md grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    <div>
                        <div className="text-2xl sm:text-3xl font-black">{realData.totalFarmers}</div>
                        <div className="text-xs text-emerald-200 uppercase mt-1">Onboarded Farmers</div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-black">{realData.totalMT}</div>
                        <div className="text-xs text-emerald-200 uppercase mt-1">Total Procured</div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{realData.formattedDBT}</div>
                        <div className="text-xs text-emerald-200 uppercase mt-1">DBT Settled</div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-black">2 Centers</div>
                        <div className="text-xs text-emerald-200 uppercase mt-1">Active Hubs</div>
                    </div>
                </section>

                {/* AI PREDICTOR & PRICING WIDGET */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* AI Predictor Form */}
                    <section className="lg:col-span-6 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase border border-emerald-500/20">
                                <Cpu className="w-3.5 h-3.5" /> Random Forest Regressor
                            </div>
                            <h2 className="text-2xl font-black text-white">AI Crop MSP Predictor</h2>
                            <p className="text-slate-400 text-xs sm:text-sm">
                                Compute estimated MSP dynamically based on production cost, domestic market rates, and inflation.
                            </p>

                            <form onSubmit={handlePredictPrice} className="space-y-3 pt-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1">Crop</label>
                                        <select 
                                            value={aiForm.Crop_Name}
                                            onChange={(e) => setAiForm({...aiForm, Crop_Name: e.target.value})}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none"
                                        >
                                            <option value="Wheat">Wheat</option>
                                            <option value="Paddy">Paddy</option>
                                            <option value="Gram">Gram</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1">Production Cost (₹)</label>
                                        <input 
                                            type="number" 
                                            value={aiForm.Production_Cost}
                                            onChange={(e) => setAiForm({...aiForm, Production_Cost: Number(e.target.value)})}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1">Market Price (₹)</label>
                                        <input 
                                            type="number" 
                                            value={aiForm.Domestic_Market_Price}
                                            onChange={(e) => setAiForm({...aiForm, Domestic_Market_Price: Number(e.target.value)})}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1">Inflation Rate (%)</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            value={aiForm.Inflation_Rate}
                                            onChange={(e) => setAiForm({...aiForm, Inflation_Rate: Number(e.target.value)})}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={loadingAi}
                                    className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                                >
                                    {loadingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    <span>{loadingAi ? 'Analyzing Feature Matrix...' : 'Calculate Predicted MSP'}</span>
                                </button>
                            </form>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-bold uppercase">Estimated MSP Output:</span>
                            <span className="text-2xl font-black text-emerald-400 font-mono">
                                {predictedPrice !== null ? `₹${predictedPrice} / Qtl` : '₹ ----'}
                            </span>
                        </div>
                    </section>

                    {/* Yard Telemetry Radar */}
                    <section className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase border border-emerald-200 mb-2">
                                <Activity className="w-3.5 h-3.5" /> Yard Telemetry
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">Active Mandi Centers</h2>
                            <p className="text-slate-500 text-xs sm:text-sm">Real-time congestion and estimated wait times across hubs.</p>
                        </div>

                        <div className="space-y-3">
                            {realData.centers.map((center, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm text-slate-900">{center.name}</h4>
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-slate-400" /> {center.location}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-slate-500 block">Queue Wait</span>
                                        <strong className="text-emerald-700 font-mono text-sm">~{center.wait}</strong>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Anti-arbitrage quota locks active on all weighbridges.</span>
                        </div>
                    </section>

                </div>

                {/* PRICE TREND & FORECAST CHART WIDGET */}
                <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Market Intelligence
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">15-Year Historical & AI Future Forecast</h2>
                            <p className="text-xs sm:text-sm text-slate-500">Historical trend analysis combined with non-linear multi-year projections.</p>
                        </div>

                        <div className="flex items-center gap-2">
                            {["Wheat", "Paddy", "Gram"].map((crop) => (
                                <button
                                    key={crop}
                                    onClick={() => setSelectedCrop(crop)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                        selectedCrop === crop
                                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                                    }`}
                                >
                                    {crop}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-72 sm:h-80 w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-center relative">
                        {loadingChart ? (
                            <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                                <Loader2 size={20} className="animate-spin text-emerald-600" />
                                <span>Loading trend data from Flask microservice...</span>
                            </div>
                        ) : chartData ? (
                            <Line
                                data={chartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { grid: { color: "#e2e8f0" } },
                                        x: { grid: { display: false } }
                                    }
                                }}
                            />
                        ) : (
                            <p className="text-sm text-slate-400 font-bold">No trend data available.</p>
                        )}
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-8 px-4 text-center text-xs space-y-2 mt-12">
                <p className="font-bold text-white text-sm">SmartMandi National APMC Procurement Portal Prototype</p>
                <p className="max-w-md mx-auto leading-relaxed">
                    Integrated with PFMS Direct Benefit Transfer & Krishi Upaj Mandi Automated Yard Logistics.
                </p>
            </footer>
        </div>
    );
}