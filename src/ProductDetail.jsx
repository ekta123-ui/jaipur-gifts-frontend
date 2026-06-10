import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    HiOutlineArrowLeft, HiOutlineShoppingBag, 
    HiOutlineHeart, HiOutlineShare, HiCheckCircle, 
    HiOutlineShieldCheck, HiOutlineTruck, HiOutlineRefresh 
} from 'react-icons/hi';
import api, { reviewService } from './api';
import { getRating, getPrice } from './formatters.js';
import GiftCardButtons from './GiftCardButtons'; // Import the new button component
import { allGifts } from './data/gifts.js';
import { addToCart } from './utils/cart';

const guarantees = [
    { icon: <HiOutlineTruck />, label: "Same Day Delivery" },
    { icon: <HiOutlineShieldCheck />, label: "Secure Packaging" },
    { icon: <HiOutlineRefresh />, label: "Easy Returns" },
];

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recentItems, setRecentItems] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [wishlisted, setWishlisted] = useState(false);
    const [copied, setCopied] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewNotice, setReviewNotice] = useState('');

    useEffect(() => {
        const checkWishlistStatus = async () => {
            const token = localStorage.getItem('token');
            if (token && !['null', 'undefined', ''].includes(token.trim())) {
                try {
                    const response = await api.get('/wishlist');
                    const wl = response.data?.wishlist || [];
                    setWishlisted(wl.includes(id));
                } catch (err) {
                    console.error("Failed to check wishlist status:", err);
                }
            }
        };
        checkWishlistStatus();
    }, [id]);

    const toggleWishlist = async () => {
        const token = localStorage.getItem('token');
        if (!token || ['null', 'undefined', ''].includes(token.trim())) {
            navigate('/login', { state: { from: location } });
            return;
        }

        const nextState = !wishlisted;
        setWishlisted(nextState);

        try {
            if (nextState) {
                await api.post(`/wishlist/${id}`);
            } else {
                await api.delete(`/wishlist/${id}`);
            }
        } catch (err) {
            console.error("Failed to update wishlist:", err);
            setWishlisted(!nextState); // revert
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                const res = await reviewService.fetchForGift(id);
                setReviews(res.data.reviews || []);
            } catch (err) {
                console.error("Failed to load reviews:", err);
            }
        }, 0);

        return () => clearTimeout(timer);
    }, [id]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token || ['null', 'undefined', ''].includes(token.trim())) {
            navigate('/login', { state: { from: location } });
            return;
        }

        try {
            await reviewService.submit({
                giftId: product.giftId,
                rating: reviewRating,
                comment: reviewComment,
            });
            setReviewComment('');
            setReviewRating(5);
            setReviewNotice('Review submitted. It will show publicly after admin approval.');
        } catch (err) {
            setReviewNotice(err.response?.data?.error || 'Unable to submit review.');
        }
    };

    useEffect(() => {
        // 1. Load existing recently viewed items from storage
        const loadRecent = () => {
            const stored = JSON.parse(localStorage.getItem('jaipur_recently_viewed') || '[]');
            // Filter out the current product from being displayed in the list
            setRecentItems(stored.filter(item => item.giftId !== id));
        };

        const fetchProduct = async () => {
            try {
                const response = await api.get(`/gifts/${id}`);
                let data = response.data.gift || response.data;
                
                if (data) {
                    // Enrich data if missing information in MongoDB
                    const localGift = allGifts.find(g => g.giftId === data.giftId || g.giftId === id);
                    const enriched = {
                        ...localGift,
                        ...data,
                        imgUrl: data.imgUrl || localGift?.imgUrl || "/images/placeholder.jpg",
                        details: data.details || localGift?.details || [],
                        description: data.description || localGift?.description || ""
                    };
                    setProduct(enriched);

                    // Fetch Related Products from the same category
                    try {
                        const relatedRes = await api.get(`/gifts?category=${data.category}`);
                        const relatedData = relatedRes.data.gifts || (Array.isArray(relatedRes.data) ? relatedRes.data : []);
                        const enrichedRelated = relatedData.map(p => {
                            const local = enriched.giftId === p.giftId ? enriched : allGifts.find(lg => lg.giftId === p.giftId);
                            return {
                                ...p,
                                imgUrl: p.imgUrl || local?.imgUrl || "/images/placeholder.jpg"
                            };
                        }).filter(p => p.giftId !== enriched.giftId).slice(0, 4);
                        setRelatedProducts(enrichedRelated);
                    } catch (relErr) {
                        console.error("Error fetching related products:", relErr);
                    }

                    // 2. Update storage with the current product
                    const stored = JSON.parse(localStorage.getItem('jaipur_recently_viewed') || '[]');
                    const filtered = stored.filter(item => item.giftId !== enriched.giftId);
                    const snapshot = {
                        giftId: enriched.giftId || id,
                        name: enriched.name,
                        imgUrl: enriched.imgUrl,
                        price: enriched.price,
                        rating: enriched.rating
                    };
                    const updated = [snapshot, ...filtered].slice(0, 8); // Keep last 8 items
                    localStorage.setItem('jaipur_recently_viewed', JSON.stringify(updated));
                }
            } catch (err) {
                console.error("Error fetching product details:", err);
            } finally {
                setLoading(false);
            }
        };
        
        loadRecent();
        fetchProduct();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full" 
                />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent text-gray-700">
                <p className="text-xl font-semibold">Product not found.</p>
            </div>
        );
    }

    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    return (
        <div className="min-h-screen bg-transparent py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div {...fadeIn} className="mb-8">
                    <Link to="/" className="inline-flex items-center text-pink-600 hover:text-pink-800 transition-colors font-medium">
                        <HiOutlineArrowLeft className="mr-2" /> Back to Home
                    </Link>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-[2rem] shadow-xl p-8 md:p-12">
                    {/* Product Image & Quick Actions */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-lg"
                        >
                            <img
                                src={product.imgUrl || "/images/placeholder.jpg"}
                                alt={product.name}
                                onError={(e) => { e.target.src = "/images/placeholder.jpg"; }}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-4 left-4">
                                <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full flex items-center gap-1 shadow-md">
                                    <span className="text-base font-bold text-gray-800">
                                        ⭐ {getRating(product.rating)}

                                        {product.rating?.count && (
                                          <span className="ml-1 text-sm text-gray-500">
                                            ({product.rating.count} reviews)
                                          </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Action buttons below image */}
                        <div className="flex gap-3 mt-4">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={toggleWishlist}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border-2 transition-all"
                                style={wishlisted
                                    ? { borderColor: '#BE185D', color: '#BE185D', background: 'rgba(190,24,93,0.06)' }
                                    : { borderColor: 'rgba(0,0,0,0.1)', color: '#6B7280', background: 'white' }
                                }>
                                <HiOutlineHeart className={wishlisted ? 'text-rose-500 fill-rose-500' : ''} />
                                {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={handleShare}
                                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm border-2 transition-all"
                                style={{ borderColor: 'rgba(0,0,0,0.1)', color: '#6B7280', background: 'white' }}>
                                {copied ? <><HiCheckCircle className="text-green-500" /> Copied!</> : <><HiOutlineShare /> Share</>}
                            </motion.button>
                        </div>
                    </div>

                    {/* Product Details */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        className="flex flex-col justify-between"
                    >
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-gray-900 via-pink-700 to-purple-700 bg-clip-text text-transparent mb-4 leading-tight tracking-tight">
                                {product.name}
                            </h1>
                            <motion.p 
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-pink-600 text-3xl md:text-5xl font-black mb-6"
                            >
                                {getPrice(product.price)}
                            </motion.p>
                            <p className="text-gray-600 text-lg mb-8 leading-relaxed">{product.description}</p>

                             <div className="mb-8">
                                 <h3 className="text-xl font-bold text-gray-800 mb-3">Key Features:</h3>
                                 <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
                                     {product.details.map((detail, index) => (
                                         <li key={index} className="flex items-center">
                                             <span className="text-pink-500 mr-2">•</span> {detail}
                                         </li>
                                     ))}
                                 </ul>
                             </div>

                             {/* Guarantees */}
                             <div className="flex flex-wrap gap-4 mb-8">
                                 {guarantees.map(({ icon, label }) => (
                                     <div key={label} className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                         <span className="text-pink-500 text-base">{icon}</span>
                                         {label}
                                     </div>
                                 ))}
                             </div>
                        </div>

                        {/* Customize and Chat Buttons */}
                        <GiftCardButtons product={product} />
                    </motion.div>
                </div>

                {/* Related Products Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="mt-20 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8"
                >
                    <div className="bg-white rounded-[2rem] shadow-sm border border-orange-100 p-6 md:p-8">
                        <h2 className="font-display text-3xl font-bold text-gray-900 italic mb-6">Customer Reviews</h2>
                        <div className="space-y-4">
                            {reviews.length > 0 ? reviews.map(review => (
                                <div key={review._id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center justify-between gap-3 mb-2">
                                        <p className="font-black text-gray-900">{review.name || review.user?.name || 'Customer'}</p>
                                        <span className="text-amber-500 font-black">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                                </div>
                            )) : (
                                <p className="text-gray-400 font-bold py-8 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                                    No published reviews yet.
                                </p>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleReviewSubmit} className="bg-white rounded-[2rem] shadow-sm border border-orange-100 p-6 md:p-8 h-fit">
                        <h3 className="text-xl font-black text-gray-900 mb-4">Write a Review</h3>
                        <select
                            value={reviewRating}
                            onChange={(e) => setReviewRating(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 font-bold mb-4"
                        >
                            {[5, 4, 3, 2, 1].map(value => (
                                <option key={value} value={value}>{value} Stars</option>
                            ))}
                        </select>
                        <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            required
                            minLength={5}
                            rows="4"
                            placeholder="Share your experience..."
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 resize-none text-sm font-medium"
                        />
                        {reviewNotice && <p className="text-xs font-bold text-orange-600 mt-3">{reviewNotice}</p>}
                        <button className="btn-primary w-full mt-5">Submit Review</button>
                    </form>
                </motion.div>

                {relatedProducts.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-24"
                    >
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-8 italic">
                            Related <span className="shimmer-text">Gifts</span>
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {relatedProducts.map((item) => (
                                <Link key={item.giftId} to={`/product/${item.giftId}`} className="group">
                                    <div className="card-luxury p-3 h-full flex flex-col transition-all group-hover:shadow-2xl">
                                        <div className="relative h-40 rounded-xl overflow-hidden mb-3">
                                            <img 
                                                src={item.imgUrl || "/images/placeholder.jpg"} 
                                                alt={item.name}
                                                onError={(e) => { e.target.src = "/images/placeholder.jpg"; }}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                            />
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
                                            {item.name}
                                        </h3>
                                        <div className="flex items-center justify-between mt-auto pt-2">
                                            <p className="text-pink-600 font-black text-xs">
                                                {getPrice(item.price)}
                                            </p>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => { e.preventDefault(); addToCart(item); navigate('/cart'); }}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg"
                                                style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)' }}
                                            >
                                                <HiOutlineShoppingBag className="w-4 h-4" />
                                            </motion.button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Recently Viewed Section */}
                {recentItems.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-24"
                    >
                        <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-8 italic">
                            Recently <span className="shimmer-text">Viewed</span>
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {recentItems.slice(0, 4).map((item) => (
                                <Link key={item.giftId} to={`/product/${item.giftId}`} className="group">
                                    <div className="card-luxury p-3 h-full flex flex-col transition-all group-hover:shadow-2xl">
                                        <div className="relative h-40 rounded-xl overflow-hidden mb-3">
                                            <img 
                                                src={item.imgUrl || "/images/placeholder.jpg"} 
                                                alt={item.name}
                                                onError={(e) => { e.target.src = "/images/placeholder.jpg"; }}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                            />
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
                                            {item.name}
                                        </h3>
                                        <p className="text-pink-600 font-black text-xs mt-auto">
                                            {getPrice(item.price)}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;
