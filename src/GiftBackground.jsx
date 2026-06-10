
import { useMemo } from 'react';
import { motion } from 'framer-motion';

const SYMBOLS = ['✦', '❋', '◈', '⬡', '✿', '❀', '◇', '✺', '⊹', '✧', '◉', '⟡'];

const GiftBackground = () => {
    const floaters = useMemo(() =>
        [...Array(20)].map((_, i) => ({
            id: i,
            symbol: SYMBOLS[i % SYMBOLS.length],
            top: `${5 + (i * 4.7) % 90}%`,
            left: `${3 + (i * 5.1) % 94}%`,
            size: 14 + (i % 5) * 6,
            duration: 14 + (i % 8) * 2,
            delay: (i * 0.7) % 6,
            opacity: 0.06 + (i % 4) * 0.04,
        })), []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none mandala-bg">
            {/* Primary ambient gradient */}
            <div className="absolute inset-0"
                style={{
                    background: `
                        radial-gradient(ellipse 70% 70% at 15% 10%, rgba(232,72,10,0.08) 0%, transparent 60%),
                        radial-gradient(ellipse 60% 60% at 85% 20%, rgba(212,160,23,0.10) 0%, transparent 55%),
                        radial-gradient(ellipse 80% 50% at 50% 90%, rgba(190,24,93,0.07) 0%, transparent 65%),
                        radial-gradient(ellipse 40% 40% at 70% 50%, rgba(232,72,10,0.05) 0%, transparent 50%)
                    `
                }}
            />

            {/* Animated mesh orbs */}
            <motion.div
                animate={{ x: [0, 60, -30, 0], y: [0, -40, 20, 0], scale: [1, 1.2, 0.9, 1] }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(232,72,10,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }}
            />
            <motion.div
                animate={{ x: [0, -50, 40, 0], y: [0, 30, -50, 0], scale: [1, 0.8, 1.3, 1] }}
                transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 }}
                className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(212,160,23,0.13) 0%, transparent 70%)', filter: 'blur(80px)' }}
            />
            <motion.div
                animate={{ x: [0, 80, -40, 0], y: [0, 40, -30, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 10 }}
                className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(190,24,93,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }}
            />

            {/* Diagonal decorative lines */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="diag" width="80" height="80" patternUnits="userSpaceOnUse">
                        <path d="M0 80 L80 0" stroke="#E8480A" strokeWidth="1" fill="none"/>
                        <circle cx="0" cy="0" r="2" fill="#D4A017"/>
                        <circle cx="80" cy="80" r="2" fill="#D4A017"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#diag)"/>
            </svg>

            {/* Floating decorative symbols */}
            {floaters.map((item) => (
                <motion.div
                    key={item.id}
                    className="absolute font-display"
                    style={{
                        top: item.top,
                        left: item.left,
                        fontSize: item.size,
                        color: item.id % 3 === 0 ? '#E8480A' : item.id % 3 === 1 ? '#D4A017' : '#BE185D',
                        opacity: item.opacity,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        x: [0, 15, -10, 0],
                        rotate: [0, 20, -15, 0],
                        opacity: [item.opacity, item.opacity * 2.5, item.opacity],
                    }}
                    transition={{
                        duration: item.duration,
                        repeat: Infinity,
                        delay: item.delay,
                        ease: "easeInOut"
                    }}
                >
                    {item.symbol}
                </motion.div>
            ))}

            {/* Top decorative border strip */}
            <div className="absolute top-0 left-0 right-0 h-1"
                style={{ background: 'linear-gradient(90deg, #E8480A, #D4A017, #BE185D, #D4A017, #E8480A)' }}
            />
        </div>
    );
};

export default GiftBackground;
