import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { HiOutlineArrowUp } from 'react-icons/hi';

const BackToTop = () => {
    const [isVisible, setIsVisible] = useState(false);
    const { scrollYProgress } = useScroll();

    useEffect(() => {
        const toggleVisibility = () => {
            // Show button after scrolling down 400px
            if (window.scrollY > 400) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    className="fixed bottom-8 right-8 z-[100] flex items-center justify-center w-[60px] h-[60px] cursor-pointer"
                    onClick={scrollToTop}
                >
                    {/* SVG Progress Ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 60 60">
                        {/* Background track */}
                        <circle
                            cx="30"
                            cy="30"
                            r="26"
                            stroke="rgba(232, 72, 10, 0.1)"
                            strokeWidth="4"
                            fill="none"
                        />
                        {/* Progress circle */}
                        <motion.circle
                            cx="30"
                            cy="30"
                            r="26"
                            stroke="url(#ring-gradient)"
                            strokeWidth="4"
                            style={{ pathLength: scrollYProgress }}
                            fill="none"
                            strokeLinecap="round"
                        />
                        <defs>
                            <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#E8480A" />
                                <stop offset="100%" stopColor="#D4A017" />
                            </linearGradient>
                        </defs>
                    </svg>

                    <motion.button
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xl z-10"
                        style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)' }}
                    >
                        <HiOutlineArrowUp size={20} strokeWidth={2} />
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BackToTop;
