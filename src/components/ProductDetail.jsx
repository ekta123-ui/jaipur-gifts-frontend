import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineStar, HiOutlineArrowLeft, HiOutlineHeart, HiOutlineShare, HiCheckCircle, HiOutlineShieldCheck, HiOutlineTruck, HiOutlineRefresh } from 'react-icons/hi';
import GiftCardButtons from '../GiftCardButtons';
import api from '../api';

const guarantees = [
    { icon: <HiOutlineTruck />, label: "Same Day Delivery" },
    { icon: <HiOutlineShieldCheck />, label: "Secure Packaging" },
    { icon: <HiOutlineRefresh />, label: "Easy Returns" },
];

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [wishlisted, setWishlisted] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/gifts/${id}`);
                setProduct(res.data);
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Loading...
            </div>
        );
    }

    if (!product) {
        return <div>Product Not Found</div>;
    }

    return (
        <div className="min-h-screen bg-transparent py-12 px-6">
            <div className="max-w-7xl mx-auto">

                {/* Back link */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full transition-all hover:gap-3"
                        style={{ color: '#E8480A', background: 'rgba(232,72,10,0.08)' }}>
                        <HiOutlineArrowLeft /> Back to Home
                    </Link>
                </motion.div>

                <div className="card-luxury p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* ── IMAGE ── */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7 }}
                        className="relative"
                    >
                        <div className="relative h-[320px] md:h-[520px] rounded-[1.75rem] overflow-hidden shadow-2xl">
                            <img 
                                src={product.imgUrl || "/images/placeholder.jpg"} 
                                alt={product.name} 
                                onError={(e) => { e.target.src = "/images/placeholder.jpg"; }}
                                className="w-full h-full object-cover" 
                            />

                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                            {/* Tag */}
                            {product.tag && (
                                <div className="absolute top-5 left-5 px-4 py-1.5 rounded-full text-xs font-black text-white"
                                    style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)', boxShadow: '0 4px 16px rgba(232,72,10,0.4)' }}>
                                    ✦ {product.tag}
                                </div>
                            )}

                            {/* Rating */}
                            <div className="absolute bottom-5 left-5 px-4 py-2 bg-white/95 backdrop-blur-md rounded-full flex items-center gap-1.5 shadow-lg">
                                <HiOutlineStar className="text-amber-500 w-4 h-4" />
                                <span className="font-black text-gray-800 text-sm">{product.rating?.average || product.rating}</span>
                                <span className="text-gray-400 text-xs">({product.rating?.count || 0} reviews)</span>
                            </div>
                        </div>

                        {/* Action buttons below image */}
                        <div className="flex gap-3 mt-4">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => setWishlisted(!wishlisted)}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border-2 transition-all"
                                style={wishlisted
                                    ? { borderColor: '#BE185D', color: '#BE185D', background: 'rgba(190,24,93,0.06)' }
                                    : { borderColor: 'rgba(0,0,0,0.1)', color: '#6B7280', background: 'white' }
                                }>
                                <HiOutlineHeart className={wishlisted ? 'text-rose-500' : ''} />
                                {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={handleShare}
                                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm border-2 transition-all"
                                style={{ borderColor: 'rgba(0,0,0,0.1)', color: '#6B7280', background: 'white' }}>
                                {copied ? <><HiCheckCircle className="text-green-500" /> Copied!</> : <><HiOutlineShare /> Share</>}
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* ── DETAILS ── */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.15 }}
                        className="flex flex-col justify-between"
                    >
                        <div>
                            {/* Name */}
                            <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-3 leading-tight" style={{ fontStyle: 'italic' }}>
                                {product.name}
                            </h1>

                            {/* Price */}
                            <motion.div
                                animate={{ scale: [1, 1.03, 1] }}
                                transition={{ duration: 2.5, repeat: Infinity }}
                                className="inline-block mb-6"
                            >
                                <span className="text-4xl md:text-5xl font-black"
                                    style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    {product.price?.display || product.price}
                                </span>
                            </motion.div>

                            {/* Description */}
                            <p className="text-gray-500 text-base leading-relaxed mb-8">{product.description}</p>

                            {/* Features */}
                            <div className="mb-8">
                                <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest mb-4">Key Features</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {product.details.map((detail, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 + i * 0.08 }}
                                            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold text-gray-700"
                                            style={{ background: 'rgba(232,72,10,0.04)', border: '1px solid rgba(232,72,10,0.1)' }}
                                        >
                                            <span className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)' }} />
                                            {detail}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Guarantees */}
                            <div className="flex flex-wrap gap-4 mb-8">
                                {guarantees.map(({ icon, label }) => (
                                    <div key={label} className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                        <span className="text-amber-500 text-base">{icon}</span>
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="space-y-3">
                            <GiftCardButtons product={product} />
                            <p className="text-center text-xs text-gray-400 font-medium">
                                🔒 Secure checkout · Free gift wrapping included
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
