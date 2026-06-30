import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineArrowLeft, HiOutlineShoppingBag } from 'react-icons/hi';
import { customRequestService } from './api';
import { allGifts } from './data/gifts';
import { getPrice } from './formatters.js';

const CustomizeRequest = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [message, setMessage] = useState(location.state?.initialMessage || '');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [product, setProduct] = useState(location.state?.product || null);

    useEffect(() => {
        if (!product && id) {
            const gift = allGifts.find(item => item.giftId === id || item._id === id || item.name === id);
            setProduct(gift || null);
        }
    }, [id, product]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (!message.trim()) {
            setError('Please describe your requirements before sending.');
            return;
        }

        const requestPayload = {
            name: localStorage.getItem('userName') || '',
            email: localStorage.getItem('userEmail') || '',
            message: product
                ? `Gift: ${product.name} (${product.giftId})\n\n${message.trim()}`
                : message.trim(),
            phone: localStorage.getItem('userPhone') || '',
            source: 'product',
        };

        setSubmitting(true);
        try {
            await customRequestService.create(requestPayload);
            setSuccess('Your customization request has been submitted. Admin will contact you soon.');
            setMessage('');
        } catch (err) {
            console.error('Customization request failed:', err);
            setError(err.response?.data?.error || 'Failed to send your request. Please try again later.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCheckout = () => {
        if (!product) {
            setError('Please select a product before proceeding to checkout.');
            return;
        }

        const item = {
            ...product,
            quantity: 1,
            customMessage: message.trim(),
        };
        navigate('/checkout', { state: { product: item } });
    };

    return (
        <div className="min-h-screen bg-transparent py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <Link to={product ? `/product/${product.giftId}` : '/'} className="inline-flex items-center text-pink-600 hover:text-pink-800 transition-colors font-medium">
                        <HiOutlineArrowLeft className="mr-2" /> Back to product
                    </Link>
                </motion.div>

                <div className="rounded-[2rem] bg-white shadow-xl p-8 md:p-12">
                    <div className="mb-10 text-center">
                        <h1 className="text-4xl font-black text-gray-900 mb-3">Send Your Requirement to Admin</h1>
                        <p className="text-gray-600 text-base sm:text-lg">
                            Tell us exactly how you want your gift customized and our team will review it.
                        </p>
                    </div>

                    {product && (
                        <div className="mb-8 rounded-3xl border border-orange-100 bg-orange-50/80 p-6">
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <img
                                    src={product.imgUrl || '/images/placeholder.jpg'}
                                    alt={product.name}
                                    className="w-28 h-28 rounded-3xl object-cover shadow-sm"
                                />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                                    <p className="text-sm font-medium text-gray-500">Gift ID: {product.giftId}</p>
                                    <p className="mt-3 text-lg font-black text-orange-600">{getPrice(product.price)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">Requirement Details</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={7}
                                className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-5 py-4 text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 resize-none"
                                placeholder="Describe the changes, packaging, message, occasion, colors, or other details you want..."
                            />
                        </div>

                        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
                        {success && <p className="text-sm font-semibold text-green-600">{success}</p>}

                        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-600 to-orange-500 px-6 py-4 text-white font-black shadow-lg shadow-pink-200 transition-transform active:scale-95 disabled:opacity-60"
                            >
                                <HiOutlineShoppingBag className="text-lg" />
                                {submitting ? 'Sending Request...' : 'Send Request to Admin'}
                            </button>
                            {product && (
                                <button
                                    type="button"
                                    onClick={handleCheckout}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-white text-orange-600 font-black px-6 py-4 shadow-sm transition-transform active:scale-95"
                                >
                                    Continue to Checkout
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CustomizeRequest;
