import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineWifi, HiOutlineCloud, HiOutlineRefresh } from 'react-icons/hi';
import api from './api';

const ConnectionStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isApiDown, setIsApiDown] = useState(false);
    const [retrying, setRetrying] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        const handleApiUnreachable = () => setIsApiDown(true);
        const handleApiReachable = () => setIsApiDown(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('api-unreachable', handleApiUnreachable);
        window.addEventListener('api-reachable', handleApiReachable);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('api-unreachable', handleApiUnreachable);
            window.removeEventListener('api-reachable', handleApiReachable);
        };
    }, []);

    const manualRetry = async () => {
        setRetrying(true);
        try {
            // Simple health check to the backend
            await api.get('/gifts?limit=1');
            setIsApiDown(false);
        } catch {
            // If it still fails, the interceptor in api.js will keep isApiDown true
        } finally {
            setTimeout(() => setRetrying(false), 600);
        }
    };

    const showBanner = !isOnline || isApiDown;
    const message = !isOnline ? "No Internet Connection" : "Server is currently unreachable";
    const Icon = !isOnline ? HiOutlineCloud : HiOutlineWifi;

    return (
        <AnimatePresence>
            {showBanner && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="fixed top-[76px] left-0 right-0 z-[60] px-4"
                >
                    <div className="max-w-md mx-auto bg-white/80 backdrop-blur-xl border border-amber-200/50 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                <Icon size={20} className={!isOnline ? "" : "animate-pulse"} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">Connection Status</p>
                                <p className="text-sm font-bold text-gray-700 leading-tight">{message}</p>
                            </div>
                        </div>
                        <button 
                            onClick={manualRetry}
                            disabled={retrying}
                            className="p-2.5 rounded-xl bg-amber-600 text-white shadow-lg shadow-amber-200 active:scale-90 transition-all disabled:opacity-50"
                        >
                            <HiOutlineRefresh size={18} className={retrying ? "animate-spin" : ""} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConnectionStatus;
