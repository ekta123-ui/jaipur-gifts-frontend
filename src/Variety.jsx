import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineStar, HiOutlineHeart, HiOutlineArrowLeft, HiOutlineViewGrid, HiOutlineViewList } from 'react-icons/hi';
import api from './api';
import { getRating, getPrice } from './formatters.js';
import GiftCardButtons from './GiftCardButtons';
import { allGifts } from './data/gifts.js';



const categoryMeta = {
    birthday: { label: "Birthday", emoji: "🎂", color: "#E8480A" },
    anniversary: { label: "Anniversary", emoji: "❤️", color: "#BE185D" },
    'baby-shower': { label: "Baby Shower", emoji: "🍼", color: "#D4A017" },
    'groom-to-be': { label: "Groom To Be", emoji: "🤵", color: "#475569" },
    'bride-to-be': { label: "Bride To Be", emoji: "👰", color: "#DB2777" },
    wedding: { label: "Wedding", emoji: "💍", color: "#E8480A" },
    friendship: { label: "Friendship", emoji: "🤝", color: "#F59E0B" },
    appreciation: { label: "Appreciation", emoji: "⭐", color: "#059669" },
};

const Variety = () => {
    const { category } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [gifts, setGifts] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [view, setView] = useState('grid');
    const [loading, setLoading] = useState(true);
    const [dbOffline, setDbOffline] = useState(false);
    const [lastSynced, setLastSynced] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sort, setSort] = useState('-createdAt');

    useEffect(() => {
        const fetchWishlist = async () => {
            const token = localStorage.getItem('token');
            if (token && !['null', 'undefined', ''].includes(token.trim())) {
                try {
                    const response = await api.get('/wishlist');
                    setWishlist(response.data?.wishlist || []);
                } catch (err) {
                    console.error("Failed to fetch wishlist:", err);
                }
            }
        };
        fetchWishlist();
    }, []);

    const fetchGifts = useCallback(async () => {
        setLoading(true);
        // Create a unique cache key based on the category
        const filterKey = [category || 'all', searchTerm, minPrice, maxPrice, sort].join('_');
        const cacheKey = `jaipur_gifts_cache_${filterKey}`;
        
        try {
            const params = new URLSearchParams();
            if (category) params.set('category', category);
            if (searchTerm.trim()) params.set('search', searchTerm.trim());
            if (minPrice) params.set('minPrice', minPrice);
            if (maxPrice) params.set('maxPrice', maxPrice);
            if (sort) params.set('sort', sort);
            params.set('limit', '100');

            const endpoint = `/gifts?${params.toString()}`;
            const response = await api.get(endpoint);
            
            // Resilient data parsing: check for .gifts property or if data itself is an array
            const data = response?.data?.gifts || (Array.isArray(response?.data) ? response.data : []);
            setDbOffline(false);

            if (data.length > 0) {
                // Enrich data with images and details from local fallback if missing in MongoDB
                const enrichedData = data.map(dbGift => {
                    const localGift = allGifts.find(g => g.giftId === dbGift.giftId) || allGifts.find(g => g.name === dbGift.name);
                    return {
                        ...dbGift,
                        imgUrl: dbGift.imgUrl || localGift?.imgUrl || "/images/placeholder.jpg",
                        details: dbGift.details || localGift?.details || [],
                        description: dbGift.description || localGift?.description || ""
                    };
                });
                setGifts(enrichedData);
                // Save to localStorage for offline mode
                const syncTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                setLastSynced(syncTime);
                localStorage.setItem(cacheKey, JSON.stringify({ items: data, time: syncTime }));
            } else {
                const fallback = category ? allGifts.filter(g => g.category === category) : allGifts;
                setGifts(fallback.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())));
            }
        } catch (err) {
            console.error("Failed to fetch gifts from DB:", err);
            setDbOffline(true);

            // Try to load from localStorage first (Offline Mode)
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const { items, time } = JSON.parse(cached);
                setGifts(items);
                setLastSynced(time);
            } else {
                // Final fallback to hardcoded data if no cache exists
                const fallback = category ? allGifts.filter(g => g.category === category) : allGifts;
                setGifts(fallback.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())));
            }
        } finally {
            setLoading(false);
        }
    }, [category, searchTerm, minPrice, maxPrice, sort]);

    useEffect(() => {
        const timer = setTimeout(fetchGifts, 250);
        return () => clearTimeout(timer);
    }, [fetchGifts]);

    const meta = category ? categoryMeta[category] : null;
    const categoryTitle = meta ? meta.label : "All Collections";

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" 
                />
            </div>
        );
    }

    const toggleWishlist = async (giftId) => {
        const token = localStorage.getItem('token');
        if (!token || ['null', 'undefined', ''].includes(token.trim())) {
            // Redirect to login, specifying where we came from
            navigate('/login', { state: { from: location } });
            return;
        }

        const isCurrentlyWishlisted = wishlist.includes(giftId);
        // Optimistic update
        setWishlist(prev => isCurrentlyWishlisted ? prev.filter(id => id !== giftId) : [...prev, giftId]);

        try {
            if (isCurrentlyWishlisted) {
                await api.delete(`/wishlist/${giftId}`);
            } else {
                await api.post(`/wishlist/${giftId}`);
            }
        } catch (err) {
            console.error("Failed to sync wishlist with database:", err);
            // Revert optimistic update
            setWishlist(prev => isCurrentlyWishlisted ? [...prev, giftId] : prev.filter(id => id !== giftId));
        }
    };

    return (
        <div className="min-h-screen bg-transparent pb-24">

            {/* Database Offline Warning */}
            <AnimatePresence>
                {dbOffline && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="bg-amber-50/80 backdrop-blur-md border-b border-amber-200/50 px-6 py-2.5 flex items-center justify-center gap-3 text-amber-800 text-[10px] font-black uppercase tracking-[0.2em] relative z-20"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
                        </span>
                        <span>Database Offline • Viewing {lastSynced ? `Cached Catalog (Synced ${lastSynced})` : 'Backup Catalog'}</span>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={fetchGifts}
                            className="ml-4 px-3 py-1 rounded-full bg-amber-200/40 hover:bg-amber-200/60 transition-colors border border-amber-400/30 text-amber-900 font-black"
                        >
                            Retry Connection
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Header */}
            <div className="relative overflow-hidden py-16 px-6 mb-8"
                style={{
                    background: 'linear-gradient(135deg, rgba(232,72,10,0.06) 0%, rgba(212,160,23,0.08) 50%, rgba(190,24,93,0.05) 100%)',
                    borderBottom: '1px solid rgba(212,160,23,0.12)'
                }}>
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 -translate-y-1/2 translate-x-1/4"
                    style={{ background: 'radial-gradient(circle, #E8480A, transparent)', filter: 'blur(60px)' }} />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-20 translate-y-1/2 -translate-x-1/4"
                    style={{ background: 'radial-gradient(circle, #D4A017, transparent)', filter: 'blur(60px)' }} />

                <div className="max-w-7xl mx-auto relative z-10">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold mb-8 px-4 py-2 rounded-full transition-all hover:gap-3"
                        style={{ color: '#E8480A', background: 'rgba(232,72,10,0.08)' }}>
                        <HiOutlineArrowLeft /> Back to Occasions
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div>
                            {meta && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-5xl mb-4">{meta.emoji}
                                </motion.div>
                            )}
                            <motion.h1
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6 }}
                                className="font-display text-5xl md:text-7xl font-bold text-gray-900 leading-none"
                                style={{ fontStyle: 'italic' }}
                            >
                                {categoryTitle}
                                <br />
                                <span style={{
                                    background: 'linear-gradient(135deg, #E8480A, #D4A017, #BE185D)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                                }}>
                                    Gift Ideas
                                </span>
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-gray-400 mt-3 text-base font-medium"
                            >
                                {gifts.length} handpicked treasures for your special someone
                            </motion.p>
                        </div>

                        {/* View toggle */}
                        <div className="flex items-center gap-2 p-1 rounded-2xl self-start" style={{ background: 'rgba(232,72,10,0.06)', border: '1px solid rgba(232,72,10,0.12)' }}>
                            {[['grid', <HiOutlineViewGrid />], ['list', <HiOutlineViewList />]].map(([v, icon]) => (
                                <button key={v} onClick={() => setView(v)}
                                    className="p-2.5 rounded-xl transition-all font-bold text-lg"
                                    style={view === v
                                        ? { background: 'linear-gradient(135deg, #E8480A, #D4A017)', color: 'white', boxShadow: '0 4px 12px rgba(232,72,10,0.3)' }
                                        : { color: '#9CA3AF' }
                                    }
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto px-6">
                <div className="bg-white/80 border border-orange-100 rounded-2xl p-4 mb-8 shadow-sm grid grid-cols-1 md:grid-cols-[1fr_140px_140px_180px] gap-3">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search gifts by name, tag, or ID..."
                        className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 font-medium text-sm"
                    />
                    <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="Min price"
                        className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 font-medium text-sm"
                    />
                    <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="Max price"
                        className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 font-medium text-sm"
                    />
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 font-bold text-sm"
                    >
                        <option value="-createdAt">Newest</option>
                        <option value="price.amount">Price Low to High</option>
                        <option value="-price.amount">Price High to Low</option>
                        <option value="-rating.average">Top Rated</option>
                        <option value="name">Name A to Z</option>
                    </select>
                </div>

                {gifts.length > 0 ? (
                    <motion.div
                        layout
                        initial="hidden"
                        animate="visible"
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
                        className={view === 'grid'
                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7"
                            : "flex flex-col gap-5"
                        }
                    >
                        <AnimatePresence>
                            {gifts.map((gift) => (
                                <motion.div
                                    key={gift.giftId}
                                    layout
                                    variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    whileHover={{ y: view === 'grid' ? -10 : -3 }}
                                    className={`group card-luxury overflow-hidden flex ${view === 'list' ? 'flex-row h-44' : 'flex-col'}`}
                                >
                                    {/* Image */}
                                    <div className={`relative overflow-hidden flex-shrink-0 ${view === 'list' ? 'w-44 h-full rounded-l-[2rem] rounded-r-none' : 'h-60 rounded-t-[2rem]'}`}>
                                        <Link to={`/product/${gift.giftId}`}>
                                        <img 
                                            src={gift.imgUrl || "/images/placeholder.jpg"} 
                                            alt={gift.name}
                                            onError={(e) => { e.target.src = "/images/placeholder.jpg"; }}
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                        </Link>

                                        {/* Tag */}
                                        {gift.tag && (
                                            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black text-white"
                                                style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)', boxShadow: '0 4px 12px rgba(232,72,10,0.4)' }}>
                                                {gift.tag}
                                            </div>
                                        )}

                                        {/* Rating */}
                                        <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur rounded-full flex items-center gap-1 shadow-md">
                                            <HiOutlineStar className="w-3.5 h-3.5 text-amber-500" />
                                            <span className="text-xs font-black text-gray-800">
                                                {getRating(gift.rating)}
                                                {gift.rating?.count && (
                                                    <span className="ml-1 text-[9px] font-medium text-gray-500">
                                                        ({gift.rating.count})
                                                    </span>
                                                )}
                                            </span>
                                        </div>

                                        {/* Wishlist */}
                                        <button
                                            onClick={(e) => { e.preventDefault(); toggleWishlist(gift.giftId); }}
                                            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md transition-all hover:scale-110"
                                        >
                                            <HiOutlineHeart className={`w-4 h-4 transition-colors ${wishlist.includes(gift.giftId) ? 'text-rose-500 fill-rose-500' : 'text-gray-400'}`} />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex flex-col flex-1 justify-between">
                                        <div>
                                            <h3 className="font-black text-gray-900 text-base leading-tight group-hover:text-orange-700 transition-colors">
                                                {gift.name}
                                            </h3>
                                            <p className="text-orange-600 font-bold text-sm mt-1">
                                                {getPrice(gift.price)}
                                            </p>
                                            {view === 'list' && (
                                                <p className="text-gray-400 text-xs mt-1 font-medium">
                                                    Perfect for {gift.category.replace('-', ' ')} celebrations
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <GiftCardButtons product={gift} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-24 rounded-[3rem] border-2 border-dashed"
                        style={{ borderColor: 'rgba(232,72,10,0.2)', background: 'rgba(232,72,10,0.02)' }}
                    >
                        <div className="text-6xl mb-6">🎁</div>
                        <p className="text-gray-400 text-xl font-semibold mb-2">Coming Soon!</p>
                        <p className="text-gray-300 text-sm mb-8">We're curating the best gifts for this occasion.</p>
                        <Link to="/"
                            className="inline-block px-10 py-4 text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)' }}>
                            Explore Other Occasions
                        </Link>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Variety;
