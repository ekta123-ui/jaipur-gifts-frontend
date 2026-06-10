import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineTruck } from 'react-icons/hi';
import api from './api';
import OrderTimeline from './OrderTimeline';

const TrackOrder = () => {
    const location = useLocation();
    const [orderId, setOrderId] = useState(location.state?.orderId || '');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTrack = async (e) => {
        e.preventDefault();
        if (!orderId.trim()) return;

        setLoading(true);
        setError('');
        setOrder(null);

        try {
            // Remove leading '#' if present to prevent browser fragment issues
            const sanitizedId = orderId.trim().replace(/^#/, '');
            const res = await api.get(`/orders/track/${sanitizedId}`);
            setOrder(res.data.order);
        } catch (err) {
            setError(err.response?.data?.error || 'Order ID not found. Please verify the ID from your confirmation email.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex flex-col items-center justify-center px-6 py-16 bg-transparent relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl z-10"
            >
                <div className="card-luxury p-8 md:p-12 text-center">
                    <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-6 shadow-xl text-white"
                        style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)' }}>
                        <HiOutlineTruck size={32} />
                    </div>
                    <h1 className="font-display text-4xl font-bold text-gray-900 mb-2 italic">Track Your Gift</h1>
                    <p className="text-gray-400 text-sm mb-8">Enter your Order ID to see the journey of your surprise.</p>

                    <form onSubmit={handleTrack} className="relative max-w-md mx-auto mb-10">
                        <input
                            type="text"
                            placeholder="Enter Order ID (e.g. 64f1...)"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            className="w-full pl-6 pr-32 py-4 rounded-2xl text-gray-800 text-sm font-medium outline-none transition-all shadow-inner border border-gray-100 focus:border-orange-500"
                            style={{ background: 'rgba(232,72,10,0.03)' }}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="absolute right-2 top-2 bottom-2 px-6 rounded-xl text-white font-bold text-sm transition-transform active:scale-95 disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)' }}
                        >
                            {loading ? '...' : 'Track'}
                        </button>
                    </form>

                    <AnimatePresence>
                        {error && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-500 text-sm font-bold">{error}</motion.p>
                        )}

                        {order && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-8 text-left border-t pt-8 border-gray-100"
                            >
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Status</p>
                                        <p className="text-xl font-bold text-orange-600 capitalize">{order.status}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Est. Delivery</p>
                                        <p className="font-bold text-gray-700">{new Date(order.estimatedDelivery).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <OrderTimeline status={order.status} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default TrackOrder;
