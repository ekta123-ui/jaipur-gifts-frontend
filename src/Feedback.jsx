import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineChatAlt2, HiStar, HiOutlineSparkles } from 'react-icons/hi';

const categories = ["Product Quality", "Delivery Speed", "Packaging", "Customer Support", "Overall Experience"];

const Feedback = () => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [selected, setSelected] = useState([]);
    const [submitted, setSubmitted] = useState(false);

    const toggleCategory = (cat) => {
        setSelected(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
    const ratingColors = ['', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#E8480A'];

    return (
        <div className="min-h-[90vh] flex items-center justify-center bg-transparent relative overflow-hidden px-6 py-16">
            {/* Ambient blobs */}
            <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 14, repeat: Infinity }}
                className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(212,160,23,0.10) 0%, transparent 70%)', filter: 'blur(80px)' }} />
            <motion.div animate={{ x: [0, -30, 0], y: [0, 40, 0] }} transition={{ duration: 18, repeat: Infinity }}
                className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(190,24,93,0.08) 0%, transparent 70%)', filter: 'blur(80px)' }} />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="relative z-10 w-full max-w-2xl"
            >
                <div className="card-luxury p-8 md:p-12 relative overflow-hidden">
                    {/* Top accent */}
                    <div className="absolute top-0 left-8 right-8 h-1 rounded-b-full"
                        style={{ background: 'linear-gradient(90deg, #E8480A, #D4A017, #BE185D)' }} />

                    <AnimatePresence mode="wait">
                        {!submitted ? (
                            <motion.div key="form" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
                                {/* Header */}
                                <div className="text-center mb-10">
                                    <motion.div whileHover={{ rotate: 15 }}
                                        className="inline-flex w-16 h-16 rounded-[1.25rem] items-center justify-center mb-5 shadow-xl"
                                        style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)', boxShadow: '0 12px 32px rgba(232,72,10,0.35)' }}>
                                        <HiOutlineChatAlt2 className="w-8 h-8 text-white" />
                                    </motion.div>
                                    <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-2" style={{ fontStyle: 'italic' }}>
                                        Share Your{" "}
                                        <span style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                            Experience
                                        </span>
                                    </h1>
                                    <p className="text-gray-400 font-medium text-sm">Your feedback helps us make Jaipur Gifts even more special.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-7">
                                    {/* Name & Email */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {[
                                            { label: "Full Name", type: "text", placeholder: "Priya Sharma" },
                                            { label: "Email Address", type: "email", placeholder: "hello@example.com" },
                                        ].map(({ label, type, placeholder }) => (
                                            <div key={label} className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-wider text-gray-500 ml-1">{label}</label>
                                                <input type={type} placeholder={placeholder} required
                                                    className="w-full px-5 py-3.5 rounded-2xl text-gray-800 text-sm font-medium outline-none transition-all placeholder:text-gray-300"
                                                    style={{ background: 'rgba(232,72,10,0.03)', border: '1.5px solid rgba(0,0,0,0.08)' }}
                                                    onFocus={e => e.target.style.borderColor = '#E8480A'}
                                                    onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.08)'}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Star Rating */}
                                    <div className="text-center py-2">
                                        <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-4">How was your experience?</label>
                                        <div className="flex justify-center gap-2 mb-2">
                                            {[...Array(5)].map((_, i) => {
                                                const val = i + 1;
                                                return (
                                                    <motion.button key={i} type="button"
                                                        whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.85 }}
                                                        onClick={() => setRating(val)}
                                                        onMouseEnter={() => setHover(val)}
                                                        onMouseLeave={() => setHover(0)}
                                                    >
                                                        <HiStar size={46} className="transition-colors duration-150"
                                                            style={{ color: val <= (hover || rating) ? '#E8480A' : '#E5E7EB' }}
                                                        />
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                        <AnimatePresence mode="wait">
                                            {(hover || rating) > 0 && (
                                                <motion.span key={hover || rating}
                                                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                    className="text-sm font-black"
                                                    style={{ color: ratingColors[hover || rating] }}>
                                                    {ratingLabels[hover || rating]}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Category tags */}
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-3 ml-1">What are you rating?</label>
                                        <div className="flex flex-wrap gap-2">
                                            {categories.map(cat => (
                                                <motion.button key={cat} type="button"
                                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                    onClick={() => toggleCategory(cat)}
                                                    className="px-4 py-2 rounded-full text-xs font-bold transition-all"
                                                    style={selected.includes(cat)
                                                        ? { background: 'linear-gradient(135deg, #E8480A, #D4A017)', color: 'white', boxShadow: '0 4px 12px rgba(232,72,10,0.35)' }
                                                        : { background: 'rgba(232,72,10,0.05)', color: '#6B7280', border: '1.5px solid rgba(232,72,10,0.15)' }
                                                    }>
                                                    {cat}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-wider text-gray-500 ml-1">Your Message</label>
                                        <textarea rows="4" placeholder="Tell us what you loved (or what we can do better)..." required
                                            className="w-full px-5 py-4 rounded-3xl text-gray-800 text-sm font-medium outline-none transition-all resize-none placeholder:text-gray-300"
                                            style={{ background: 'rgba(232,72,10,0.03)', border: '1.5px solid rgba(0,0,0,0.08)' }}
                                            onFocus={e => e.target.style.borderColor = '#E8480A'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.08)'}
                                        />
                                    </div>

                                    {/* Submit */}
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        className="w-full py-4 rounded-2xl text-white font-black text-base shadow-xl overflow-hidden relative"
                                        style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017, #BE185D)', backgroundSize: '200% 200%', boxShadow: '0 12px 32px rgba(232,72,10,0.35)' }}
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            <HiOutlineSparkles /> Send Feedback
                                        </span>
                                    </motion.button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div key="success"
                                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                className="text-center py-12"
                            >
                                {/* Confetti burst */}
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                    className="text-8xl mb-6 inline-block">🎉
                                </motion.div>
                                <h2 className="font-display text-4xl font-bold text-gray-900 mb-3" style={{ fontStyle: 'italic' }}>Thank You!</h2>
                                <p className="text-gray-400 text-base mb-8 max-w-sm mx-auto">
                                    Your feedback has been received. We appreciate you helping us improve Jaipur Gifts!
                                </p>
                                {rating > 0 && (
                                    <div className="flex justify-center gap-1 mb-8">
                                        {[...Array(rating)].map((_, i) => (
                                            <motion.div key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
                                                <HiStar size={28} style={{ color: '#E8480A' }} />
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                                <button onClick={() => { setSubmitted(false); setRating(0); setSelected([]); }}
                                    className="text-sm font-bold hover:underline transition-colors" style={{ color: '#E8480A' }}>
                                    Send another response
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default Feedback;
