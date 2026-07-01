import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineCheckCircle, HiOutlineShoppingBag, HiOutlineTruck, HiOutlineClock, HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { orderService } from './api';
import { getPrice } from './formatters.js';
import OrderTimeline from './OrderTimeline';

const OrderConfirmation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [orderId, setOrderId] = useState(() => {
        return (location.state?.orderId || searchParams.get('orderId') || '').trim();
    });
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const cleanedId = orderId.replace(/^#/, '');
        if (!cleanedId) return;

        const fetchOrder = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await orderService.fetchOrderStatus(cleanedId);
                setOrder(res.data.order);
            } catch (err) {
                setError(err.response?.data?.error || 'Unable to load order details. Please verify your Order ID.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    const handleTrack = () => {
        if (!orderId.trim()) return;
        navigate('/track-order', { state: { orderId } });
    };

    const cleanOrderId = (id) => id?.trim().replace(/^#/, '');
    const summaryItems = order?.items || [];

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-transparent relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-4xl"
            >
                <div className="card-luxury overflow-hidden">
                    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
                        <div className="p-10 bg-white">
                            <div className="inline-flex items-center gap-3 rounded-full px-4 py-2 bg-emerald-50 text-emerald-700 mb-6">
                                <HiOutlineCheckCircle className="w-6 h-6" />
                                <span className="font-black uppercase text-xs tracking-[0.24em]">Order Confirmed</span>
                            </div>
                            <h1 className="font-display text-5xl font-bold text-gray-900 mb-4">Your royal gift is on its way.</h1>
                            <p className="text-gray-500 text-base leading-relaxed mb-8">We’ve received your order and our Jaipur gifting artisans are preparing it with care. You’ll receive updates by email, and you can also track your order anytime from your profile.</p>

                            <div className="grid gap-4 sm:grid-cols-3 mb-8">
                                <div className="rounded-3xl bg-orange-50 p-5 border border-orange-100">
                                    <p className="text-xs uppercase tracking-[0.24em] text-orange-600 font-black mb-2">Order ID</p>
                                    <p className="text-sm font-bold text-gray-900 break-all">{cleanOrderId(orderId) || '—'}</p>
                                </div>
                                <div className="rounded-3xl bg-orange-50 p-5 border border-orange-100">
                                    <p className="text-xs uppercase tracking-[0.24em] text-orange-600 font-black mb-2">Status</p>
                                    <p className="text-sm font-bold text-gray-900 capitalize">{order?.status || 'Pending'}</p>
                                </div>
                                <div className="rounded-3xl bg-orange-50 p-5 border border-orange-100">
                                    <p className="text-xs uppercase tracking-[0.24em] text-orange-600 font-black mb-2">Estimated Delivery</p>
                                    <p className="text-sm font-bold text-gray-900">{order?.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toLocaleDateString() : 'TBA'}</p>
                                </div>
                            </div>

                            <div className="rounded-[2rem] bg-slate-950/95 text-white p-8 mb-8 shadow-2xl">
                                <div className="flex items-center justify-between gap-4 mb-6">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Order summary</p>
                                        <h2 className="text-2xl font-bold">A gift fit for royalty</h2>
                                    </div>
                                    <div className="text-right text-sm text-slate-400">Total amount</div>
                                </div>
                                <div className="space-y-4">
                                    {loading ? (
                                        <p className="text-slate-300">Loading items…</p>
                                    ) : summaryItems.length > 0 ? (
                                        summaryItems.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                                                <div>
                                                    <p className="font-semibold text-white">{item.name}</p>
                                                    <p className="text-sm text-slate-400">Qty {item.quantity}</p>
                                                </div>
                                                <p className="text-sm font-bold text-white">{getPrice(item.price * item.quantity)}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-slate-300">Order details will appear here once available.</p>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-3xl bg-rose-50 border border-rose-100 p-5 text-rose-700 mb-6">
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
                                >
                                    <HiOutlineShoppingBag className="w-5 h-5" /> View My Orders
                                </button>
                                <button
                                    onClick={handleTrack}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-3xl border border-orange-200 bg-white px-6 py-4 text-sm font-bold text-orange-700 transition hover:bg-orange-50"
                                >
                                    Track Order <HiOutlineArrowNarrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-10 bg-orange-50 flex flex-col justify-between">
                            <div>
                                <div className="inline-flex items-center gap-3 rounded-full bg-white px-4 py-3 text-orange-700 font-bold mb-6">
                                    <HiOutlineTruck className="w-5 h-5" /> Delivery in progress
                                </div>
                                <OrderTimeline status={order?.status || 'pending'} />
                            </div>

                            <div className="rounded-[2rem] bg-white p-6 mt-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <HiOutlineClock className="w-5 h-5 text-orange-500" />
                                    <span className="font-bold text-orange-600">Track status anytime</span>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">A confirmation email has been sent to your inbox with your order ID and delivery details. Keep it safe for faster tracking and support.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default OrderConfirmation;
