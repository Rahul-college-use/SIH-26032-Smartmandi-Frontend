import {motion} from 'framer-motion';

function Workcard({ steps }) {
    return (
        <div>
            <section id="how-it-works" className="py-14 sm:py-20 md:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-2">
                        <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                            Simple & Transparent Flow
                        </span>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                            Kaise Kaam Karta Hai SmartMandi?
                        </h2>
                        <p className="text-slate-500 text-xs sm:text-sm md:text-base leading-relaxed">
                            4 aasan charano mein apni fasal ka sahi mulya payein, bina bheed aur bina delay ke.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {steps.map((s, idx) => (
                            <motion.div
                                whileHover={{ y: -4 }}
                                key={idx}
                                className="p-5 sm:p-6 bg-slate-50 border border-slate-100 rounded-2xl sm:rounded-3xl relative overflow-hidden group hover:border-emerald-300 transition-all flex flex-col justify-start"
                            >
                                <div className="text-4xl sm:text-5xl font-black text-slate-200 group-hover:text-emerald-100 transition-colors">
                                    {s.num}
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-2.5 group-hover:text-emerald-700 transition-colors">
                                    {s.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                                    {s.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Workcard
