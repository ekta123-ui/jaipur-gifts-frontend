import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineGift } from "react-icons/hi";
import { FaInstagram, FaFacebookF, FaTwitter } from "react-icons/fa";

const Footer = () => {
    const clearCache = () => {
        if (window.confirm("This will clear the offline catalog cache. Re-fetching will require an internet connection. Proceed?")) {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('jaipur_gifts_cache_')) {
                    localStorage.removeItem(key);
                }
            });
            alert('Catalog cache cleared successfully!');
            window.location.reload();
        }
    };

    return (
        <footer className="relative z-10 pt-20 pb-10 border-t bg-white/60 backdrop-blur-xl" style={{ borderColor: 'rgba(212,160,23,0.12)' }}>
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)' }}>
                                <HiOutlineGift className="text-white text-xl" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 font-display tracking-tight">
                                JAIPUR <span style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Gifts</span>
                            </h2>
                        </div>
                        <p className="text-gray-400 leading-relaxed text-sm font-medium">
                            Crafting unforgettable moments with luxury personalized gifts from the heart of Rajasthan.
                        </p>
                        <div className="flex gap-3">
                            {[FaInstagram, FaFacebookF, FaTwitter].map((Icon, i) => (
                                <motion.a key={i} href="#" whileHover={{ y: -4, scale: 1.15 }}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all text-white shadow-md"
                                    style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)' }}>
                                    <Icon size={15} />
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-gray-900 mb-6">Quick Links</h3>
                        <ul className="space-y-3">
                            {['Home', 'Variety', 'Feedback', 'Login', 'Admin Portal'].map((link) => (
                                <li key={link}>
                                    <Link to={link === 'Home' ? '/' : `/${link === 'Admin Portal' ? 'admin/login' : link.toLowerCase()}`}
                                        className="text-gray-400 hover:text-orange-600 font-medium transition-colors text-sm flex items-center gap-2 group">
                                        <span className="w-1 h-1 rounded-full bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {link}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <button onClick={clearCache} 
                                    className="text-gray-400 hover:text-orange-600 font-medium transition-colors text-sm flex items-center gap-2 group cursor-pointer">
                                    <span className="w-1 h-1 rounded-full bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    Clear Cache
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-gray-900 mb-6">Top Occasions</h3>
                        <ul className="space-y-3">
                            {['Birthday', 'Anniversary', 'Wedding', 'Baby Shower'].map((occ) => (
                                <li key={occ}>
                                    <Link to={`/variety/${occ.toLowerCase().replace(' ', '-')}`}
                                        className="text-gray-400 hover:text-orange-600 font-medium transition-colors text-sm flex items-center gap-2 group">
                                        <span className="w-1 h-1 rounded-full bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {occ} Gifts
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderColor: 'rgba(212,160,23,0.12)' }}>
                    <p className="text-gray-400 text-sm">© 2024 Jaipur Gifts. Handcrafted with ❤️ in Pink City.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
