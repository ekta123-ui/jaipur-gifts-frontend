import React from 'react';
import { motion } from 'framer-motion';
import { HiOutlineExclamationCircle, HiOutlineRefresh } from 'react-icons/hi';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to your console or an external reporting service
        console.error("ErrorBoundary caught a runtime crash:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center px-6 bg-gray-50/50">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-rose-100 relative overflow-hidden"
                    >
                        {/* Royal accent line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500" />

                        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-600 shadow-sm shadow-rose-100">
                            <HiOutlineExclamationCircle size={48} />
                        </div>

                        <h1 className="font-display text-3xl font-black text-gray-900 mb-3 italic">
                            System <span className="text-rose-600">Glitch</span>
                        </h1>
                        
                        <p className="text-gray-500 mb-8 font-medium text-sm leading-relaxed">
                            Something went wrong while crafting your experience. Our artisans have been notified. Please try refreshing the page.
                        </p>

                        <div className="space-y-3">
                            <button 
                                onClick={() => window.location.reload()}
                                className="w-full py-4 rounded-2xl bg-orange-600 text-white font-black text-sm shadow-xl shadow-orange-200 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                            >
                                <HiOutlineRefresh /> Reload Page
                            </button>
                            
                            <button 
                                onClick={() => window.location.href = '/'}
                                className="w-full py-4 rounded-2xl bg-white border border-gray-100 text-gray-400 font-bold text-sm hover:text-gray-600 transition-all"
                            >
                                Return Home
                            </button>
                        </div>

                        {import.meta.env.DEV && this.state.error && (
                            <div className="mt-8 p-4 bg-rose-50/50 rounded-2xl text-left border border-rose-100/50">
                                <p className="text-[10px] font-black uppercase tracking-widest text-rose-800 mb-2">Technical Insight (Dev Only)</p>
                                <pre className="text-[10px] text-rose-600 font-mono whitespace-pre-wrap break-all leading-tight">
                                    {this.state.error.message}
                                </pre>
                            </div>
                        )}
                    </motion.div>
                </div>
            );
        }

        return this.props.children; 
    }
}

export default ErrorBoundary;