import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HiOutlineShoppingBag, HiOutlinePlus } from 'react-icons/hi';
import { addToCart } from './utils/cart';

const GiftCardButtons = ({ product }) => {
    const navigate = useNavigate();

    const handleAction = () => {
        navigate('/checkout', { state: { product } });
    };

    const handleAddToCart = () => {
        addToCart(product);
    };

    return (
        <div className="mt-5 grid grid-cols-[44px_1fr] gap-2">
            <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                className="h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100"
                title="Add to cart"
            >
                <HiOutlinePlus className="text-xl" />
            </motion.button>
            <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAction}
                className="relative w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl font-bold text-white text-sm overflow-hidden group"
                style={{
                    background: 'linear-gradient(135deg, #E8480A 0%, #D4A017 50%, #BE185D 100%)',
                    backgroundSize: '200% 200%',
                    boxShadow: '0 8px 24px rgba(232, 72, 10, 0.35)',
                }}
            >
                {/* Animated shimmer overlay */}
                <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                        background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                        backgroundSize: '200% 100%',
                    }}
                    animate={{ backgroundPosition: ['-200% 0', '200% 0'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
                <HiOutlineShoppingBag className="text-white text-base relative z-10" />
                <span className="relative z-10">Buy Now</span>
            </motion.button>
        </div>
    );
};

export default GiftCardButtons;
