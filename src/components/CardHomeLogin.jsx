import { motion } from 'framer-motion';


function CardHomeLogin({user, onGetStarted, onLogin, isAdminOrOperator, navigate}) {
    return (
        <div>
            <section className="py-14 sm:py-20 bg-white border-t border-slate-100 text-center">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                        Ready to avoid long mandi lines?
                    </h2>
                    <p className="text-slate-600 text-xs sm:text-sm md:text-base max-w-xl mx-auto">
                        Abhi apna slot book karein ya apne registration number se current live queue status check karein.
                    </p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
                        {user ? (
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleDashboardRedirect}
                                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-xs shadow-emerald-200 text-sm transition-all cursor-pointer"
                            >
                                Go to {isAdminOrOperator ? 'Admin Console' : 'Farmer Dashboard'}
                            </motion.button>
                        ) : (
                            <>
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={onGetStarted || (() => navigate('/register'))}
                                    className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-xs shadow-emerald-200 text-sm transition-all cursor-pointer"
                                >
                                    Register as Farmer
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={onLogin || (() => navigate('/login'))}
                                    className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
                                >
                                    Login to Account
                                </motion.button>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}

export default CardHomeLogin
