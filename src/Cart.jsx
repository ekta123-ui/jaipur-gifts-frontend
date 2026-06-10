import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineMinus, HiOutlinePlus, HiOutlineTrash, HiOutlineShoppingBag, HiOutlineArrowLeft } from 'react-icons/hi';
import { clearCart, getCartItems, removeFromCart, updateCartQuantity } from './utils/cart';
import { getPrice } from './formatters.js';

const parsePrice = (price) => {
    if (typeof price === 'number') return price;
    if (price && typeof price === 'object' && price.amount) return price.amount;
    if (typeof price !== 'string') return 0;
    const parsed = Number(price.replace(/[^0-9.]/g, ''));
    return Number.isNaN(parsed) ? 0 : parsed;
};

const Cart = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState(getCartItems());

    useEffect(() => {
        const syncCart = () => setItems(getCartItems());
        window.addEventListener('cart-updated', syncCart);
        return () => window.removeEventListener('cart-updated', syncCart);
    }, []);

    const total = items.reduce((sum, item) => sum + parsePrice(item.price) * (Number(item.quantity) || 1), 0);

    const handleQuantity = (giftId, quantity) => {
        setItems(updateCartQuantity(giftId, quantity));
    };

    const handleRemove = (giftId) => {
        setItems(removeFromCart(giftId));
    };

    const handleClear = () => {
        clearCart();
        setItems([]);
    };

    return (
        <div className="min-h-screen px-6 py-16 max-w-5xl mx-auto">
            <Link to="/variety" className="inline-flex items-center gap-2 text-orange-600 font-bold mb-8">
                <HiOutlineArrowLeft /> Continue Shopping
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="font-display text-5xl font-bold text-gray-900 italic">Your Cart</h1>
                    <p className="text-gray-400 font-medium mt-2">{items.length} selected gift{items.length === 1 ? '' : 's'} ready for checkout.</p>
                </div>
                {items.length > 0 && (
                    <button onClick={handleClear} className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 font-bold text-sm">
                        Clear Cart
                    </button>
                )}
            </div>

            {items.length === 0 ? (
                <div className="text-center py-24 rounded-[2rem] border-2 border-dashed border-orange-100 bg-white/70">
                    <HiOutlineShoppingBag className="mx-auto text-5xl text-orange-300 mb-4" />
                    <p className="text-gray-500 font-bold mb-6">Your cart is empty.</p>
                    <Link to="/variety" className="btn-primary inline-flex items-center gap-2">
                        Explore Gifts
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                    <div className="space-y-4">
                        {items.map(item => (
                            <motion.div
                                key={item.giftId}
                                layout
                                className="bg-white/80 border border-orange-100 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 shadow-sm"
                            >
                                <img
                                    src={item.imgUrl || '/images/placeholder.jpg'}
                                    alt={item.name}
                                    onError={(e) => { e.target.src = '/images/placeholder.jpg'; }}
                                    className="w-full sm:w-28 h-28 rounded-xl object-cover bg-orange-50"
                                />
                                <div className="flex-1">
                                    <h2 className="text-lg font-black text-gray-900">{item.name}</h2>
                                    <p className="text-orange-600 font-black mt-1">{getPrice(item.price)}</p>
                                    {item.customMessage && (
                                        <p className="text-xs text-gray-500 mt-2">Note: {item.customMessage}</p>
                                    )}
                                </div>
                                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-4">
                                    <div className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 p-1">
                                        <button
                                            onClick={() => handleQuantity(item.giftId, (Number(item.quantity) || 1) - 1)}
                                            className="w-8 h-8 rounded-lg bg-white text-gray-500 flex items-center justify-center"
                                        >
                                            <HiOutlineMinus />
                                        </button>
                                        <span className="w-8 text-center font-black">{item.quantity}</span>
                                        <button
                                            onClick={() => handleQuantity(item.giftId, (Number(item.quantity) || 1) + 1)}
                                            className="w-8 h-8 rounded-lg bg-white text-gray-500 flex items-center justify-center"
                                        >
                                            <HiOutlinePlus />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(item.giftId)}
                                        className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"
                                        title="Remove"
                                    >
                                        <HiOutlineTrash />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="bg-white/90 border border-orange-100 rounded-2xl p-6 h-fit shadow-sm sticky top-28">
                        <h2 className="text-xl font-black text-gray-900 mb-5">Order Summary</h2>
                        <div className="space-y-3 text-sm font-bold text-gray-600">
                            <div className="flex justify-between">
                                <span>Items</span>
                                <span>{items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Delivery</span>
                                <span className="text-emerald-600">Free</span>
                            </div>
                            <div className="pt-4 border-t border-gray-100 flex justify-between text-lg text-gray-900">
                                <span>Total</span>
                                <span className="text-orange-600">{getPrice(total)}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/checkout', { state: { items, fromCart: true } })}
                            className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                        >
                            <HiOutlineShoppingBag /> Checkout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
