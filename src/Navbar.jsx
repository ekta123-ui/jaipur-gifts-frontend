
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineHome, HiOutlineGift, HiOutlineChatAlt2,
    HiOutlineUser, HiMenu, HiX, HiOutlineShoppingBag,
    HiOutlineLogout
} from 'react-icons/hi';
import { logout } from './api';
import { getCartCount } from './utils/cart';

const navLinks = [
    { name: 'Home', path: '/', icon: <HiOutlineHome /> },
    { name: 'Variety', path: '/variety', icon: <HiOutlineGift /> },
    { name: 'Track Order', path: '/track-order', icon: <HiOutlineShoppingBag /> },
    { name: 'Feedback', path: '/feedback', icon: <HiOutlineChatAlt2 /> },
    { name: 'Login', path: '/login', icon: <HiOutlineUser /> },
];

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isApiDown, setIsApiDown] = useState(false);
    const [cartCount, setCartCount] = useState(getCartCount());
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        const handleApiUnreachable = () => setIsApiDown(true);
        const handleApiReachable = () => setIsApiDown(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('api-unreachable', handleApiUnreachable);
        window.addEventListener('api-reachable', handleApiReachable);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('api-unreachable', handleApiUnreachable);
            window.removeEventListener('api-reachable', handleApiReachable);
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setIsOpen(false), 0);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    useEffect(() => {
        const syncCart = () => setCartCount(getCartCount());
        window.addEventListener('cart-updated', syncCart);
        window.addEventListener('storage', syncCart);
        return () => {
            window.removeEventListener('cart-updated', syncCart);
            window.removeEventListener('storage', syncCart);
        };
    }, []);

    // Check current auth status from localStorage
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    // Filter out the Login link if already logged in
    const displayLinks = navLinks.filter(link => {
        if (link.name === 'Login' && isLoggedIn) return false;
        return true;
    });

    // Add Profile link if logged in
    if (isLoggedIn && !displayLinks.find(l => l.path === '/profile')) {
        displayLinks.push({ name: 'Profile', path: '/profile', icon: <HiOutlineUser /> });
    }

    if (!displayLinks.find(l => l.path === '/cart')) {
        displayLinks.push({ name: 'Cart', path: '/cart', icon: <HiOutlineShoppingBag /> });
    }

    return (
        <nav className={`sticky top-0 z-50 w-full transition-all duration-500 ${
            scrolled
                ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-orange-900/5 border-b border-amber-100'
                : 'bg-white/80 backdrop-blur-md border-b border-amber-50'
        }`}>
            {/* Top accent line */}
            <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #E8480A, #D4A017, #BE185D, #D4A017, #E8480A)', backgroundSize: '200% 100%' }} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-18 py-3">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <motion.div
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md"
                            style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)' }}
                        >
                            <HiOutlineGift className="w-6 h-6 text-white" />
                        </motion.div>
                        <div className="flex flex-col -space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black tracking-widest text-gray-900 font-display">JAIPUR</span>
                                <div className={`w-1.5 h-1.5 rounded-full mt-1 transition-all duration-500 ${
                                    !isOnline ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' :
                                    isApiDown ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse' :
                                    'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                                }`} title={!isOnline ? "Offline" : isApiDown ? "Server Issue" : "Connected"} />
                            </div>
                            <span className="text-[10px] font-bold tracking-[0.5em] uppercase"
                                style={{ background: 'linear-gradient(90deg, #E8480A, #D4A017)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Gifts & Surprises
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {displayLinks.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`relative group flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
                                        isActive
                                            ? 'text-orange-700 bg-orange-50'
                                            : 'text-gray-500 hover:text-orange-700 hover:bg-orange-50'
                                    }`}
                                >
                                    <span className={`text-lg transition-transform duration-300 group-hover:scale-125 ${isActive ? 'text-orange-600' : 'text-amber-500'}`}>
                                        {item.icon}
                                    </span>
                                    {item.name}
                                    {item.path === '/cart' && cartCount > 0 && (
                                        <span className="min-w-5 h-5 px-1 rounded-full bg-orange-600 text-white text-[10px] font-black flex items-center justify-center">
                                            {cartCount}
                                        </span>
                                    )}
                                    {isActive && (
                                        <motion.span
                                            layoutId="nav-indicator"
                                            className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full"
                                            style={{ background: 'linear-gradient(90deg, #E8480A, #D4A017)' }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                        {isLoggedIn ? (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={logout}
                                className="ml-3 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg shadow-rose-200 transition-all bg-rose-600 hover:bg-rose-700 flex items-center gap-2"
                            >
                                <HiOutlineLogout /> Logout
                            </motion.button>
                        ) : (
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="ml-3">
                                <Link
                                    to="/login"
                                    className="px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg shadow-orange-200 transition-all"
                                    style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)' }}
                                >
                                    Order Now
                                </Link>
                            </motion.div>
                        )}
                    </div>

                    {/* Hamburger */}
                    <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-orange-50 transition-all">
                        <AnimatePresence mode="wait">
                            <motion.div key={isOpen ? 'x' : 'menu'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                {isOpen ? <HiX size={26} /> : <HiMenu size={26} />}
                            </motion.div>
                        </AnimatePresence>
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-t border-amber-50 shadow-2xl overflow-hidden"
                    >
                        <div className="flex flex-col p-5 gap-2">
                            {displayLinks.map((item, i) => (
                                <motion.div
                                    key={item.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.07 }}
                                >
                                    <Link
                                        to={item.path}
                                        className="flex items-center gap-4 px-5 py-4 rounded-2xl text-gray-700 hover:text-orange-700 hover:bg-orange-50 font-bold text-lg transition-all"
                                    >
                                        <span className="text-2xl text-amber-500 p-2 bg-amber-50 rounded-xl">{item.icon}</span>
                                        {item.name}
                                        {item.path === '/cart' && cartCount > 0 && (
                                            <span className="ml-auto min-w-6 h-6 px-1 rounded-full bg-orange-600 text-white text-xs font-black flex items-center justify-center">
                                                {cartCount}
                                            </span>
                                        )}
                                    </Link>
                                </motion.div>
                            ))}
                            {isLoggedIn && (
                                <motion.button
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={logout}
                                    className="flex items-center gap-4 px-5 py-4 rounded-2xl text-rose-600 hover:bg-rose-50 font-bold text-lg transition-all text-left"
                                >
                                    <span className="text-2xl p-2 bg-rose-50 rounded-xl"><HiOutlineLogout /></span>
                                    Logout
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
