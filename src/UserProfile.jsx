import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineUser, HiOutlineMail, HiOutlineBadgeCheck, HiOutlineShoppingBag, HiOutlineClock, HiOutlineRefresh, HiOutlineX, HiOutlineLocationMarker, HiOutlineDuplicate, HiOutlineHeart } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import api, { orderService } from './api';
import { getPrice } from './formatters.js';
import { allGifts } from './data/gifts.js';
import OrderTimeline from './OrderTimeline';

const UserProfile = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [wishlistGifts, setWishlistGifts] = useState([]);
    const [loadingWishlist, setLoadingWishlist] = useState(true);

    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');

    useEffect(() => {
        const loadMyOrders = async () => {
            try {
                const res = await orderService.fetchMyOrders();
                // Only show the 3 most recent orders on the profile overview
                setOrders(res.data.orders.slice(0, 3));
            } catch (err) {
                console.error("Failed to load personal orders", err);
            } finally {
                setLoadingOrders(false);
            }
        };
        loadMyOrders();
    }, []);

    useEffect(() => {
        const loadWishlist = async () => {
            try {
                const res = await api.get('/wishlist');
                const list = res.data?.wishlist || [];
                // Enrich items using allGifts catalog
                const enriched = list.map(giftId => {
                    return allGifts.find(g => g.giftId === giftId);
                }).filter(Boolean);
                setWishlistGifts(enriched);
            } catch (err) {
                console.error("Failed to load wishlist items:", err);
            } finally {
                setLoadingWishlist(false);
            }
        };
        loadWishlist();
    }, []);

    const handleRemoveFromWishlist = async (e, giftId) => {
        e.stopPropagation();
        try {
            await api.delete(`/wishlist/${giftId}`);
            setWishlistGifts(prev => prev.filter(g => g.giftId !== giftId));
        } catch (err) {
            console.error("Failed to remove item from wishlist:", err);
        }
    };

    const handleReorder = (e, order) => {
        e.stopPropagation(); // Prevent triggering the parent navigation to Track Order
        
        const items = order.items.map(item => {
            const local = allGifts.find(g => g.giftId === item.giftId || g.name === item.name);
            return {
                giftId: item.giftId,
                name: item.name,
                price: item.price,
                quantity: item.quantity || 1,
                imgUrl: item.imgUrl || local?.imgUrl || "/images/placeholder.jpg",
                customMessage: item.customMessage || '',
            };
        });

        navigate('/checkout', { state: { items } });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'text-emerald-600 bg-emerald-50';
            case 'delivered': return 'text-blue-600 bg-blue-50';
            case 'cancelled': return 'text-rose-600 bg-rose-50';
            default: return 'text-orange-600 bg-orange-50';
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-6 py-16 bg-transparent relative overflow-hidden">
            {/* Ambient background matching theme */}
            <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 12, repeat: Infinity }}
                className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(232,72,10,0.10) 0%, transparent 70%)', filter: 'blur(80px)' }} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-lg"
            >
                <div className="card-luxury p-8 md:p-10">
                    <div className="absolute top-0 left-8 right-8 h-1 rounded-b-full"
                        style={{ background: 'linear-gradient(90deg, #E8480A, #D4A017, #BE185D)' }} />

                    <div className="text-center mb-10">
                        <motion.div 
                            whileHover={{ rotate: 10, scale: 1.05 }}
                            className="inline-flex w-20 h-20 rounded-[1.5rem] items-center justify-center mb-5 shadow-xl text-white"
                            style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)', boxShadow: '0 12px 32px rgba(232,72,10,0.35)' }}>
                            <HiOutlineUser size={40} />
                        </motion.div>
                        <h1 className="font-display text-4xl font-bold text-gray-900 mb-1 italic">Royal Profile</h1>
                        <p className="text-gray-400 text-sm font-medium">Your personalized gifting concierge</p>
                    </div>

                    <div className="space-y-5">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-orange-50/30 border border-orange-100/50 group hover:bg-orange-50/50 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-orange-600 shadow-sm border border-orange-100">
                                <HiOutlineUser size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Full Name</p>
                                <p className="text-gray-900 font-bold text-lg">{name || 'Honoured Guest'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50/30 border border-amber-100/50 group hover:bg-amber-50/50 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
                                <HiOutlineMail size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Email Identity</p>
                                <p className="text-gray-900 font-bold text-lg">{email || 'Not registered'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-rose-50/30 border border-rose-100/50 group hover:bg-rose-50/50 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-rose-600 shadow-sm border border-rose-100">
                                <HiOutlineBadgeCheck size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Account Rank</p>
                                <p className="text-gray-900 font-bold uppercase tracking-widest">{role || 'Patron'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Orders Section */}
                    <div className="mt-12">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-gray-900 flex items-center gap-2">
                                <HiOutlineClock className="text-orange-500" /> Recent Royal Orders
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {loadingOrders ? (
                                <div className="h-20 flex items-center justify-center text-gray-300 animate-pulse font-bold text-sm">Fetching your history...</div>
                            ) : orders.length > 0 ? (
                                orders.map((order) => (
                                    <motion.div 
                                        key={order._id}
                                        whileHover={{ x: 5 }}
                                        className="p-4 rounded-2xl bg-white border border-gray-100 flex items-center justify-between group cursor-pointer shadow-sm"
                                        onClick={() => setSelectedOrder(order)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                                                <img 
                                                    src={order.items[0]?.imgUrl || allGifts.find(g => g.giftId === order.items[0]?.giftId || g.name === order.items[0]?.name)?.imgUrl || "/images/placeholder.jpg"} 
                                                    alt={order.items[0]?.name}
                                                    onError={(e) => { e.target.src = "/images/placeholder.jpg"; }}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-xs font-black text-gray-400">ID: {order._id.slice(-6).toUpperCase()}</p>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigator.clipboard.writeText(order._id);
                                                        }}
                                                        className="text-gray-300 hover:text-orange-500 transition-colors"
                                                        title="Copy Full ID"
                                                    >
                                                        <HiOutlineDuplicate size={12} />
                                                    </button>
                                                </div>
                                                <p className="text-sm font-bold text-gray-800">{order.items[0]?.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                            
                                            <motion.button
                                                whileHover={{ scale: 1.1, rotate: 180 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => handleReorder(e, order)}
                                                className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center transition-colors hover:bg-orange-600 hover:text-white shadow-sm"
                                                title="Reorder this gift"
                                            >
                                                <HiOutlineRefresh size={16} />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <p className="text-center py-6 text-gray-400 text-sm font-medium border-2 border-dashed border-gray-100 rounded-2xl">No orders placed yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Wishlist Section */}
                    <div className="mt-10 pt-8 border-t border-gray-100/80">
                        <h3 className="text-xs font-black uppercase tracking-[0.25em] text-gray-900 flex items-center gap-2 mb-6">
                            <HiOutlineHeart className="text-pink-600 fill-pink-600" /> My Royal Wishlist
                        </h3>

                        <div className="space-y-3">
                            {loadingWishlist ? (
                                <div className="h-20 flex items-center justify-center text-gray-300 animate-pulse font-bold text-sm">Fetching your collection...</div>
                            ) : wishlistGifts.length > 0 ? (
                                wishlistGifts.map((gift) => (
                                    <motion.div 
                                        key={gift.giftId}
                                        whileHover={{ x: 5 }}
                                        className="p-4 rounded-2xl bg-white border border-gray-100 flex items-center justify-between group cursor-pointer shadow-sm"
                                        onClick={() => navigate(`/product/${gift.giftId}`)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                                                <img 
                                                    src={gift.imgUrl || "/images/placeholder.jpg"} 
                                                    alt={gift.name}
                                                    onError={(e) => { e.target.src = "/images/placeholder.jpg"; }}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800 line-clamp-1">{gift.name}</p>
                                                <p className="text-xs font-black text-pink-600">{getPrice(gift.price)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => handleRemoveFromWishlist(e, gift.giftId)}
                                                className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center transition-colors hover:bg-rose-600 hover:text-white shadow-sm"
                                                title="Remove from Wishlist"
                                            >
                                                <HiOutlineX size={16} />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <p className="text-center py-6 text-gray-400 text-sm font-medium border-2 border-dashed border-gray-100 rounded-2xl">Your wishlist is empty.</p>
                            )}
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/track-order')}
                        className="btn-primary w-full mt-10 flex items-center justify-center gap-3 text-base"
                    >
                        <HiOutlineShoppingBag /> Journey of My Gifts
                    </motion.button>
                </div>
            </motion.div>

            {/* Order Summary Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-orange-100"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">Order Summary</p>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-xl font-black text-gray-900">ID: {selectedOrder._id}</h2>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(selectedOrder._id);
                                                }}
                                                className="p-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors shadow-sm"
                                                title="Copy Full ID"
                                            >
                                                <HiOutlineDuplicate size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedOrder(null)}
                                        className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-orange-600 transition-colors"
                                    >
                                        <HiOutlineX size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Items List */}
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Treasures Included</h4>
                                        <div className="space-y-3">
                                            {selectedOrder.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm font-bold">
                                                    <span className="text-gray-700">{item.quantity}x {item.name}</span>
                                                    <span className="text-gray-900">{getPrice(item.price)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Delivery Info */}
                                    <div className="pt-6 border-t border-gray-50">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                                            <HiOutlineLocationMarker className="text-orange-500" /> Delivery To
                                        </h4>
                                        <p className="text-sm font-bold text-gray-800 leading-relaxed">
                                            {selectedOrder.deliveryAddress.fullName}<br />
                                            <span className="text-gray-500 font-medium">
                                                {selectedOrder.deliveryAddress.addressLine1}, {selectedOrder.deliveryAddress.city} - {selectedOrder.deliveryAddress.pincode}
                                            </span>
                                        </p>
                                    </div>

                                    {/* Total */}
                                    <OrderTimeline status={selectedOrder.status} />

                                    <div className="p-5 rounded-2xl bg-orange-50/50 border border-orange-100 flex justify-between items-center">
                                        <span className="text-xs font-black uppercase tracking-widest text-orange-800">Total Royal Amount</span>
                                        <span className="text-2xl font-black text-orange-600">{getPrice(selectedOrder.totalAmount)}</span>
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <button 
                                        onClick={() => navigate('/track-order', { state: { orderId: selectedOrder._id } })}
                                        className="flex-1 py-4 rounded-2xl bg-gray-900 text-white font-black text-sm transition-transform active:scale-95"
                                    >
                                        Live Track Journey
                                    </button>
                                    <button 
                                        onClick={(e) => { handleReorder(e, selectedOrder); setSelectedOrder(null); }}
                                        className="px-6 rounded-2xl bg-white border border-gray-100 text-orange-600 shadow-sm transition-transform active:scale-95"
                                    >
                                        <HiOutlineRefresh size={20} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserProfile;
