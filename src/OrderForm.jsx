import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineUser, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineShoppingBag, HiOutlineOfficeBuilding, HiHashtag } from 'react-icons/hi';
import { orderService } from './api';
import { getPrice } from './formatters.js';
import { allGifts } from './data/gifts.js';
import { clearCart } from './utils/cart';

const OrderForm = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const product = state?.product;
    const checkoutItems = state?.items || (product ? [{ ...product, quantity: 1 }] : []);
    const fromCart = Boolean(state?.fromCart);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        addressLine1: '',
        city: '',
        pincode: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (checkoutItems.length === 0) {
        return <div className="text-center py-20">No product selected. Please go back and select a gift.</div>;
    }

    // Helper to safely parse price strings (e.g. "₹1,299" -> 1299)
    const parsePrice = (price) => {
        if (typeof price === 'number') return price;
        if (price && typeof price === 'object' && price.amount) return price.amount;
        if (typeof price !== 'string') return 0;
        const cleaned = price.replace(/[^0-9.]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (checkoutItems.some(item => !item.giftId)) {
            setError("Missing Gift ID. Please re-select the product from the collection page.");
            return;
        }

        setLoading(true);
        setError('');

        const items = checkoutItems.map(item => {
            const localFallback = allGifts.find(g => g.giftId === item.giftId || g.name === item.name);
            return {
                giftId: item.giftId || item._id || item.id,
                name: item.name,
                price: parsePrice(item.price),
                imgUrl: item.imgUrl || localFallback?.imgUrl || "/images/placeholder.jpg",
                quantity: Number(item.quantity) || 1,
                customMessage: item.customMessage || '',
            };
        });
        const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const orderPayload = {
            items,
            deliveryAddress: { ...formData },
            paymentMethod: 'cod',
            totalAmount,
            isSameDay: false
        };

        try {
            // 1. Save to Database
            const response = await orderService.placeOrder(orderPayload);
            const orderId = response.order?._id;
            
            // 2. Open WhatsApp
            orderService.sendWhatsAppNotification(orderPayload);
            if (fromCart) clearCart();
            
            // 3. Success feedback
            alert(`Order recorded! Your Order ID is: ${orderId}. Keep this ID to track your order. Redirecting to WhatsApp for confirmation.`);
            setTimeout(() => navigate('/profile'), 100);
        } catch (error) {
            const serverError = error.response?.data?.error;
            const errorMsg = serverError ? `Server Error: ${serverError}` : "Failed to save order. Please check your connection.";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-luxury w-full max-w-lg p-8 md:p-10"
            >
                <div className="text-center mb-8">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden shadow-md border-2 border-orange-50">
                        <img
                            src={checkoutItems[0]?.imgUrl || "/images/placeholder.jpg"}
                            alt={checkoutItems[0]?.name}
                            onError={(e) => { e.target.src = "/images/placeholder.jpg"; }}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <h1 className="font-display text-3xl font-bold italic text-gray-900">Complete Your Order</h1>
                    <p className="text-gray-400 text-sm mt-2">
                        Ordering: <span className="text-orange-600 font-bold">{checkoutItems[0]?.name}</span>
                        {checkoutItems.length > 1 ? ` + ${checkoutItems.length - 1} more` : ''} ({getPrice(checkoutItems.reduce((sum, item) => sum + parsePrice(item.price) * (Number(item.quantity) || 1), 0))})
                    </p>
                </div>

                <div className="mb-6 rounded-2xl bg-orange-50/40 border border-orange-100 p-4 space-y-3">
                    {checkoutItems.map(item => (
                        <div key={item.giftId} className="flex items-center justify-between gap-4 text-sm">
                            <div className="flex items-center gap-3 min-w-0">
                                <img
                                    src={item.imgUrl || "/images/placeholder.jpg"}
                                    alt={item.name}
                                    onError={(e) => { e.target.src = "/images/placeholder.jpg"; }}
                                    className="w-10 h-10 rounded-lg object-cover"
                                />
                                <span className="font-bold text-gray-800 truncate">{item.quantity || 1}x {item.name}</span>
                            </div>
                            <span className="font-black text-orange-600 shrink-0">{getPrice(parsePrice(item.price) * (Number(item.quantity) || 1))}</span>
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2 ml-1">Full Name</label>
                        <div className="relative">
                            <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input 
                                type="text" required placeholder="John Doe"
                                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 transition-all"
                                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2 ml-1">Phone Number</label>
                        <div className="relative">
                            <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input 
                                type="tel" required placeholder="+91 00000 00000"
                                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 transition-all"
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2 ml-1">City</label>
                                <div className="relative">
                                    <HiOutlineOfficeBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <input 
                                        type="text" required placeholder="Jaipur"
                                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 transition-all"
                                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2 ml-1">Pincode</label>
                                <div className="relative">
                                    <HiHashtag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <input 
                                        type="text" required placeholder="302001" maxLength="6"
                                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 transition-all"
                                        onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2 ml-1">Delivery Address</label>
                        <div className="relative">
                            <HiOutlineLocationMarker className="absolute left-4 top-4 text-gray-300" />
                            <textarea 
                                required rows="3" placeholder="Enter your full address in Jaipur..."
                                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 transition-all"
                                onChange={(e) => setFormData({...formData, addressLine1: e.target.value})}
                            />
                        </div>
                    </div>

                    <button 
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        <HiOutlineShoppingBag /> {loading ? 'Processing...' : 'Confirm & Message on WhatsApp'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default OrderForm;
