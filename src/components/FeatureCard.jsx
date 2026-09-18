import React from 'react'
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
function FeatureCard({ features }) {
  return (
    <div>
        <section id="features" className="py-14 sm:py-20 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Designed for Farmer Convenience & Integrity
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm">
                Kisan ke samay aur mehnat ki bachat ke liye banayi gayi advanced suvidhayein.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {features.map((item, index) => (
                <motion.div
                  whileHover={{ y: -4, shadow: 'md' }}
                  key={index}
                  className="p-5 sm:p-6 bg-white hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 rounded-2xl sm:rounded-3xl transition-all duration-200 group flex flex-col justify-between shadow-xs"
                >
                  <div className="space-y-3 sm:space-y-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-emerald-50 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg group-hover:text-emerald-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-4 sm:pt-5 flex items-center text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                    <span>Smart Feature</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
    </div>
  )
}

export default FeatureCard
