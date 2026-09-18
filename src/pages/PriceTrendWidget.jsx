import { useEffect, useState } from "react";
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
    Filler,
} from "chart.js";
import { Sparkles, Loader2, BarChart3 } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const PriceTrendWidget = () => {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCrop, setSelectedCrop] = useState("Wheat");

    useEffect(() => {
        setLoading(true);
        // Use the environment variable to ensure production readiness
        const pythonApiBase = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5001';

        fetch(`${pythonApiBase}/price-trends?crop=${selectedCrop}`)
            .then((res) => res.json())
            .then((result) => {
                if (result.success && result.data) {
                    const { crop, years, prices, production_costs, domestic_market_prices, inflation_rates, demand_supplies } = result.data;
                    setChartData({
                        labels: years,
                        datasets: [
                            {
                                label: `${crop} Price (₹)`,
                                data: prices,
                                borderColor: "#10b981",
                                backgroundColor: "rgba(16, 185, 129, 0.08)",
                                borderWidth: 3.5,
                                pointBackgroundColor: "#065f46",
                                pointBorderColor: "#ffffff",
                                pointBorderWidth: 2,
                                pointRadius: 5,
                                pointHoverRadius: 8,
                                tension: 0.3,
                                fill: true,
                                extraData: {
                                    cropName: crop,
                                    productionCosts: production_costs || [],
                                    domesticMarketPrices: domestic_market_prices || [],
                                    inflationRates: inflation_rates || [],
                                    demandSupplies: demand_supplies || []
                                }
                            },
                        ],
                    });
                } else {
                    setChartData(null);
                }
            })
            .catch((err) => {
                console.error("Failed to fetch price trends:", err);
                setChartData(null);
            })
            .finally(() => setLoading(false));
    }, [selectedCrop]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.98)",
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 12 },
                padding: 16,
                cornerRadius: 14,
                boxWidth: 8,
                boxHeight: 8,
                usePointStyle: true,
                callbacks: {
                    title: (context) => `📅 Year: ${context[0].label}`,
                    label: (context) => {
                        const index = context.dataIndex;
                        const dataset = context.dataset;
                        const price = context.parsed.y;

                        const crop = dataset.extraData?.cropName || selectedCrop;
                        const prodCost = dataset.extraData?.productionCosts?.[index] ?? 'N/A';
                        const mktPrice = dataset.extraData?.domesticMarketPrices?.[index] ?? 'N/A';
                        const inflation = dataset.extraData?.inflationRates?.[index] ?? 'N/A';
                        const demand = dataset.extraData?.demandSupplies?.[index] ?? 'Normal';

                        return [
                            ` 🌾 Crop Name: ${crop}`,
                            ` 💰 Predicted MSP: ₹${price} / Qtl`,
                            ` 📊 Production Cost: ₹${prodCost}`,
                            ` 🏷️ Domestic Mkt Price: ₹${mktPrice}`,
                            ` 📈 Inflation Rate: ${inflation}%`,
                            ` ⚖️ Demand & Supply: ${demand}`
                        ];
                    }
                }
            }
        },
        scales: {
            y: {
                grid: { color: "rgba(226, 232, 240, 0.6)", borderDash: [4, 4] },
                ticks: { font: { size: 11, weight: '500' }, color: "#64748b" }
            },
            x: {
                grid: { display: false },
                ticks: { font: { size: 11, weight: '500' }, color: "#64748b" }
            }
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100 my-12"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-full mb-3 border border-emerald-200/60 shadow-xs">
                        <Sparkles size={13} className="text-emerald-600 animate-pulse" />
                        <span>Advanced Market Intelligence</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">5-Year Price Trend & Future AI Forecast</h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">Hover over graph points to inspect production cost, market price, inflation, and demand telemetry.</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 self-start sm:self-auto">
                    {["Wheat", "Paddy", "Gram"].map((crop) => (
                        <button
                            key={crop}
                            onClick={() => setSelectedCrop(crop)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedCrop === crop
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                                : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                                }`}
                        >
                            {crop}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-slate-50/70 p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-inner h-80 sm:h-96 flex items-center justify-center relative">
                {loading ? (
                    <div className="flex flex-col items-center gap-2 text-slate-500 text-sm font-bold">
                        <Loader2 size={28} className="animate-spin text-emerald-600" />
                        <span>Synthesizing market telemetry...</span>
                    </div>
                ) : chartData ? (
                    <Line
                        data={chartData}
                        options={chartOptions}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                        <BarChart3 size={32} />
                        <p className="text-sm font-bold">No trend data available for this selection .</p>
                        <span className="text-sm font-bold capitalize">Python Api Not Sync</span>
                    </div>
                )}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-400 px-2">
                <span>💡 Hover over nodes to reveal multi-variable economic breakdown</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" /> Live Model Synchronized
                </span>
            </div>
        </motion.div>
    );
};

export default PriceTrendWidget;