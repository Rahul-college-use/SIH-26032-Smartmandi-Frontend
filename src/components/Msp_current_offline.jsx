import React from 'react';

const Msp_current_offline = ({Scale,mspRates ,motion}) => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-200">
                    <Scale className="w-4 h-4 text-emerald-700" /> Government Benchmark
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Official MSP Rates (2026-27)
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm">
                    Central government dwara nirdharit minimum support price jo seedhe aapke bank khate mein DBT ke madhyam se transfer ki jati hai.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {mspRates.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        whileHover={{ y: -4 }}
                        className="bg-slate-50 border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                                {item.tag}
                            </span>
                            <h3 className="text-lg font-black text-slate-900 pt-2">{item.crop}</h3>
                        </div>
                        <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-bold uppercase">Procurement Rate</span>
                            <span className="text-base sm:text-lg font-black text-emerald-600 font-mono">{item.rate}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default Msp_current_offline;
