import React from 'react';
import {
    Activity,
    Sparkles,
    ShieldCheck,
    Scale,
    Cpu,
    PhoneCall,
    Mail,

} from 'lucide-react';
export default function Footer() {
    return (
        <div className="bg-slate-900 text-white border-t border-slate-800 py-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

                <div className="space-y-4 md:col-span-1">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-md">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="text-xl font-black text-white tracking-tight">
                            Smart<span className="text-emerald-500">Mandi</span>
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Digitizing APMC yard logistics, transparent queue scheduling, and instantaneous DBT bank settlements for progressive farmers.
                    </p>
                </div>

                <div className="space-y-3">
                    <h4 className="text-xs font-bold tracking-wider uppercase text-white">Quick Navigation</h4>
                    <ul className="space-y-2 text-xs">
                        <li><a href="#home" className="hover:text-emerald-400 transition-colors">Home Portal</a></li>
                        <li><a href="#ai-predictor" className="hover:text-emerald-400 transition-colors">AI Price Predictor</a></li>
                        <li><a href="#stats" className="hover:text-emerald-400 transition-colors">Live Yard Pulse</a></li>
                        <li><a href="#radar" className="hover:text-emerald-400 transition-colors">Congestion Radar</a></li>
                        <li><a href="#msp" className="hover:text-emerald-400 transition-colors">Official MSP Benchmarks</a></li>
                    </ul>
                </div>

                <div className="space-y-3">
                    <h4 className="text-xs font-bold tracking-wider uppercase text-white">System Frameworks</h4>
                    <ul className="space-y-2 text-xs">
                        <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> PFMS DBT Direct Pay</li>
                        <li className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-emerald-400" /> Random Forest Modeling</li>
                        <li className="flex items-center gap-1.5"><Scale className="w-3.5 h-3.5 text-emerald-400" /> Anti-Arbitrage Quota Lock</li>
                        <li className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-emerald-400" /> 4:1 Triage Queue Engine</li>
                    </ul>
                </div>

                <div className="space-y-3">
                    <h4 className="text-xs font-bold tracking-wider uppercase text-white">Official Support</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Need assistance with registration or slot booking? Reach out to our 24x7 helpline desk.
                    </p>
                    <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 pt-1">
                        <PhoneCall className="w-3.5 h-3.5" /> 1800-180-1551
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500" /> support@smartmandi.gov.in
                    </div>
                </div>

            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
                <p>© 2026 SmartMandi National Procurement Network. All rights reserved.</p>
                <div className="flex items-center gap-6">
                    <span className="hover:text-slate-400 transition-colors cursor-pointer">Privacy Policy</span>
                    <span className="hover:text-slate-400 transition-colors cursor-pointer">Terms of Service</span>
                    <span className="hover:text-slate-400 transition-colors cursor-pointer">Security Protocol</span>
                </div>
            </div>
        </div>
    );
}
