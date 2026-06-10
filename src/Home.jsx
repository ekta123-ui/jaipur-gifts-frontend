import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getRating } from "./formatters.js";
import api, { customRequestService } from "./api";
import { addToCart } from "./utils/cart";


import {
    HiOutlineHeart, HiOutlineStar, HiOutlineCake, HiOutlineEmojiHappy,
    HiOutlineUserGroup, HiOutlineLightningBolt, HiOutlineSparkles, HiOutlineGift,
    HiArrowRight,
    HiOutlineShoppingBag,
} from "react-icons/hi";

const occasions = [
    { id: "birthday", title: "Birthday", desc: "Make birthdays unforgettable with surprise gifts.", icon: <HiOutlineCake />, gradient: "from-orange-500 to-red-500", glow: "rgba(234,88,12,0.4)", accent: "#EA580C" },
    { id: "anniversary", title: "Anniversary", desc: "Celebrate eternal love with curated romantic boxes.", icon: <HiOutlineHeart />, gradient: "from-rose-600 to-pink-700", glow: "rgba(190,24,93,0.4)", accent: "#BE185D" },
    { id: "baby-shower", title: "Baby Shower", desc: "Sweetest gifts for the newest little ones.", icon: <HiOutlineEmojiHappy />, gradient: "from-amber-400 to-yellow-600", glow: "rgba(212,160,23,0.4)", accent: "#D4A017" },
    { id: "appreciation", title: "Appreciation", desc: "Say thank you with a touch of elegance.", icon: <HiOutlineStar />, gradient: "from-emerald-500 to-teal-700", glow: "rgba(16,185,129,0.3)", accent: "#059669" },
    { id: "wedding", title: "Wedding", desc: "Luxurious gifts for the perfect couple.", icon: <HiOutlineSparkles />, gradient: "from-amber-500 via-orange-500 to-rose-600", glow: "rgba(232,72,10,0.4)", accent: "#E8480A" },
    { id: "bride-to-be", title: "Bride To Be", desc: "Make her last single days magical.", icon: <HiOutlineSparkles />, gradient: "from-pink-400 via-rose-500 to-fuchsia-700", glow: "rgba(219,39,119,0.4)", accent: "#DB2777" },
    { id: "groom-to-be", title: "Groom To Be", desc: "Sophisticated gifts for the modern groom.", icon: <HiOutlineLightningBolt />, gradient: "from-slate-700 via-zinc-800 to-gray-900", glow: "rgba(51,65,85,0.4)", accent: "#475569" },
    { id: "friendship", title: "Friendship", desc: "Bond stronger with personalized friendship gifts.", icon: <HiOutlineUserGroup />, gradient: "from-yellow-400 to-orange-500", glow: "rgba(245,158,11,0.4)", accent: "#F59E0B" },
];

const giftIdeas = [
    { id: "a1", giftId: "A-001", name: "Chocolate Luxury Box", price: "₹1,299", rating: 4.8, tag: "Bestseller", imgUrl: "/images/download.webp" },
    { id: "a2", giftId: "A-002", name: "PhotoFrame", price: "₹1,299", rating: 4.8, tag: "Trending", imgUrl: "/images/photoFrame.webp" },
    { id: "a4", giftId: "A-004", name: "LED Photo Frame", price: "₹899", rating: 4.9, tag: "Top Pick", imgUrl: "/images/LED Frame.webp" },
    { id: "w2", giftId: "W-002", name: "Premium Wedding Bouquet", price: "₹3,499", rating: 4.9, tag: "Royal", imgUrl: "/images/premium wedding Bouquet.webp" },
];

const marqueeItems = ["Birthday Gifts", "Anniversary Surprises", "Wedding Collections", "Baby Shower Sets", "Personalized Boxes", "Same Day Delivery", "Jaipur Handcrafted", "Luxury Gifting"];

const FadeSection = ({ children, delay = 0, className = "" }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-80px" });
    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay, ease: "easeOut" }} className={className}>
            {children}
        </motion.div>
    );
};

const Home = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [customization, setCustomization] = useState("");
    const [customizing, setCustomizing] = useState(false);
    const [wishlist, setWishlist] = useState([]);

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

    const toggleWishlist = async (giftId) => {
        const token = localStorage.getItem('token');
        if (!token || ['null', 'undefined', ''].includes(token.trim())) {
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
            console.error("Failed to sync wishlist:", err);
            // Revert optimistic update
            setWishlist(prev => isCurrentlyWishlisted ? [...prev, giftId] : prev.filter(id => id !== giftId));
        }
    };

    const handleOrderNavigation = async (e) => {
        if (e) e.preventDefault();
        const baseMsg = "Hello! I would like to order a custom gift from Royal Jaipur Gifts.";
        const finalMsg = customization.trim() 
            ? `${baseMsg}\n\n*Customization Details:*\n${customization}`
            : baseMsg;

        if (customization.trim()) {
            setCustomizing(true);
            try {
                await customRequestService.create({
                    name: localStorage.getItem('userName') || '',
                    email: localStorage.getItem('userEmail') || '',
                    message: customization.trim(),
                    source: 'home',
                });
            } catch (err) {
                console.error("Failed to save customization request:", err);
            } finally {
                setCustomizing(false);
            }
        }

        const adminNumber = import.meta.env.VITE_ADMIN_PHONE || "919910863480";
        window.open(
            `https://wa.me/${adminNumber}?text=${encodeURIComponent(finalMsg)}`,
            '_blank'
        );
    };

    return (
        <div className="min-h-screen bg-transparent overflow-hidden">

            {/* ── HERO ── */}
            <section className="relative z-10 text-center pt-28 pb-20 px-6">
                {/* Decorative badge */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold mb-8 border"
                    style={{
                        background: 'rgba(232,72,10,0.06)',
                        borderColor: 'rgba(232,72,10,0.2)',
                        color: '#C2410C'
                    }}
                >
                    <HiOutlineSparkles className="text-amber-500" />
                    Jaipur's #1 Personalised Gift Studio
                    <HiOutlineSparkles className="text-amber-500" />
                </motion.div>

                {/* Main heading */}
                <motion.h1
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
                    className="font-display text-5xl md:text-[7.5rem] leading-none tracking-tight mb-6"
                    style={{ fontStyle: 'italic' }}
                >
                    <span className="block text-gray-900">Gift the</span>
                    <span className="block shimmer-text">Royal Way</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto font-medium mb-10 leading-relaxed"
                >
                    Beautiful personalized gifts for every special moment — handcrafted with the royal essence of Jaipur.
                </motion.p>

                {/* Customization Input */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="max-w-md mx-auto mb-8 relative group px-4"
                >
                    <textarea 
                        value={customization}
                        onChange={(e) => setCustomization(e.target.value)}
                        placeholder="Describe your dream gift surprise (e.g. A romantic balloon box with red roses and a polaroid...)"
                        className="w-full px-6 py-4 rounded-3xl bg-white/50 backdrop-blur-md border-2 border-orange-100 focus:border-orange-500 outline-none text-gray-800 font-medium placeholder:text-gray-400 transition-all resize-none shadow-sm"
                        rows="2"
                    />
                    <div className="absolute -top-3 left-8 px-3 bg-white text-[10px] font-black uppercase tracking-widest text-orange-600 rounded-full border border-orange-100 shadow-sm">
                        Customize Your Order
                    </div>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                    className="flex flex-wrap justify-center gap-4"
                >
                    <motion.button
                        whileHover={{ scale: 1.05, y: -3 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/variety')}
                        className="btn-primary flex items-center gap-2 text-base"
                    >
                        <HiOutlineGift /> Explore Collections
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05, y: -3 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleOrderNavigation}
                        disabled={customizing}
                        className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base border-2 text-gray-700 hover:border-orange-400 hover:text-orange-700 transition-all"
                        style={{ borderColor: 'rgba(232,72,10,0.25)', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)' }}
                    >
                        <HiOutlineShoppingBag /> {customizing ? 'Saving...' : 'Order Now'}
                    </motion.button>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="flex flex-wrap justify-center gap-6 md:gap-12 mt-10 md:mt-16"
                >
                    {[["10K+", "Happy Customers"], ["500+", "Gift Varieties"], ["4.9★", "Avg Rating"], ["24/7", "Support"]].map(([val, label]) => (
                        <div key={label} className="text-center">
                            <div className="font-display text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{val}</div>
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">{label}</div>
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* ── MARQUEE TICKER ── */}
            <div className="relative z-10 overflow-hidden py-4 my-4 border-y" style={{ borderColor: 'rgba(232,72,10,0.12)', background: 'rgba(232,72,10,0.03)' }}>
                <div className="flex gap-0 marquee-track whitespace-nowrap">
                    {[...marqueeItems, ...marqueeItems].map((item, i) => (
                        <span key={i} className="inline-flex items-center gap-3 px-6 text-sm font-bold tracking-widest uppercase" style={{ color: i % 2 === 0 ? '#E8480A' : '#D4A017' }}>
                            {item} <span className="text-amber-300 text-lg">✦</span>
                        </span>
                    ))}
                </div>
            </div>

            {/* ── OCCASIONS GRID ── */}
            <section className="relative z-10 py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <FadeSection className="text-center mb-16">
                        <span className="inline-block text-xs font-bold tracking-[0.3em] uppercase mb-4 px-4 py-1.5 rounded-full" style={{ background: 'rgba(212,160,23,0.1)', color: '#92400E' }}>
                            Shop by Occasion
                        </span>
                        <h2 className="font-display text-5xl md:text-7xl font-bold text-gray-900" style={{ fontStyle: 'italic' }}>
                            Every <span className="shimmer-text">Moment</span> Deserves
                            <br />a Special Gift
                        </h2>
                    </FadeSection>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {occasions.map((occ, i) => (
                            <FadeSection key={occ.id} delay={i * 0.07}>
                                <Link to={`/variety/${occ.id}`}>
                                    <motion.div
                                        whileHover={{ y: -10, scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="relative group rounded-[2rem] overflow-hidden cursor-pointer h-52 flex flex-col justify-end p-6 shadow-xl"
                                        style={{ boxShadow: `0 8px 32px ${occ.glow}` }}
                                    >
                                        {/* Gradient background */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${occ.gradient} opacity-90 transition-opacity duration-500 group-hover:opacity-100`} />

                                        {/* Pattern overlay */}
                                        <div className="absolute inset-0 opacity-10"
                                            style={{
                                                backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.4) 1px, transparent 1px),
                                                    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.4) 1px, transparent 1px)`,
                                                backgroundSize: '24px 24px',
                                            }}
                                        />

                                        {/* Icon */}
                                        <motion.div
                                            className="absolute top-5 right-5 text-white/30 text-6xl"
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 6, repeat: Infinity, delay: i * 0.5 }}
                                        >
                                            {occ.icon}
                                        </motion.div>

                                        {/* Arrow on hover */}
                                        <motion.div
                                            className="absolute top-5 left-5 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <HiArrowRight className="text-white text-sm" />
                                        </motion.div>

                                        {/* Content */}
                                        <div className="relative z-10">
                                            <div className="text-xl text-white/60 mb-1">{occ.icon}</div>
                                            <h3 className="text-white font-black text-lg leading-tight">{occ.title}</h3>
                                            <p className="text-white/70 text-xs font-medium mt-1 leading-snug line-clamp-2">{occ.desc}</p>
                                        </div>
                                    </motion.div>
                                </Link>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURED GIFTS ── */}
            <section className="relative z-10 py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <FadeSection className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
                        <div>
                            <span className="inline-block text-xs font-bold tracking-[0.3em] uppercase mb-4 px-4 py-1.5 rounded-full" style={{ background: 'rgba(190,24,93,0.08)', color: '#9D174D' }}>
                                Curated for You
                            </span>
                            <h2 className="font-display text-5xl md:text-6xl font-bold text-gray-900" style={{ fontStyle: 'italic' }}>
                                Bestselling <span className="shimmer-text">Gifts</span>
                            </h2>
                        </div>
                        <Link to="/variety" className="flex items-center gap-2 font-bold text-orange-600 hover:gap-4 transition-all">
                            View All <HiArrowRight />
                        </Link>
                    </FadeSection>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
                        {giftIdeas.map((gift, i) => (
                            <FadeSection key={gift.id} delay={i * 0.1}>
                                <Link to={`/product/${gift.giftId}`}>
                                    <div className="card-luxury group cursor-pointer overflow-hidden">
                                        {/* Image */}
                                        <div className="relative h-60 overflow-hidden rounded-t-[2rem]">
                                            <img
                                                src={gift.imgUrl || "/images/placeholder.jpg"}
                                                alt={gift.name}
                                                onError={(e) => { e.target.src = "/images/placeholder.jpg"; }}
                                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                            />
                                            {/* Tag */}
                                            <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                                                style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)' }}>
                                                {gift.tag}
                                            </div>
                                            {/* Rating */}
                                            <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-white/95 backdrop-blur rounded-full flex items-center gap-1 shadow-md">
                                                <HiOutlineStar className="text-amber-500 w-3.5 h-3.5" />
                                                <span className="text-xs font-bold text-gray-800">
                                                    {getRating(gift.rating)}
                                                    {gift.rating?.count && (
                                                        <span className="ml-0.5 text-[9px] text-gray-400 font-medium">({gift.rating.count})</span>
                                                    )}
                                                </span>
                                            </div>
                                            {/* Wishlist */}
                                            <button 
                                                onClick={(e) => { e.preventDefault(); toggleWishlist(gift.giftId); }}
                                                className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 transition-colors shadow-md"
                                            >
                                                <HiOutlineHeart className={`w-4 h-4 ${wishlist.includes(gift.giftId) ? 'text-rose-500 fill-rose-500' : ''}`} />
                                            </button>
                                        </div>

                                        {/* Info */}
                                        <div className="p-5">
                                            <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-orange-700 transition-colors leading-tight">{gift.name}</h3>
                                            <div className="flex items-center justify-end mt-3">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    addToCart(gift);
                                                    navigate('/cart');
                                                }}
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                                                    style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)' }}
                                                >
                                                    <HiOutlineShoppingBag className="w-5 h-5" />
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── WHY US BANNER ── */}
            <section className="relative z-10 py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <FadeSection>
                        <div className="rounded-[3rem] p-10 md:p-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center overflow-hidden relative"
                            style={{ background: 'linear-gradient(135deg, rgba(232,72,10,0.06) 0%, rgba(212,160,23,0.08) 50%, rgba(190,24,93,0.05) 100%)', border: '1px solid rgba(212,160,23,0.15)' }}>
                            {/* Decorative corners */}
                            <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 rounded-tl-xl" style={{ borderColor: '#D4A017' }} />
                            <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 rounded-tr-xl" style={{ borderColor: '#D4A017' }} />
                            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 rounded-bl-xl" style={{ borderColor: '#D4A017' }} />
                            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 rounded-br-xl" style={{ borderColor: '#D4A017' }} />

                            {[
                                ["🎁", "Personalised", "Every gift customised"],
                                ["🚀", "Same Day", "Express delivery"],
                                ["💎", "Premium Quality", "Luxury materials"],
                                ["🛡️", "100% Secure", "Safe packaging"],
                            ].map(([emoji, title, sub]) => (
                                <div key={title} className="flex flex-col items-center gap-3">
                                    <div className="text-4xl">{emoji}</div>
                                    <div className="font-black text-gray-900 text-base">{title}</div>
                                    <div className="text-xs text-gray-400 font-medium">{sub}</div>
                                </div>
                            ))}
                        </div>
                    </FadeSection>
                </div>
            </section>

        </div>
    );
};

export default Home;
