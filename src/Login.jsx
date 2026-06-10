import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineGift, HiOutlineEye, HiOutlineEyeOff, HiOutlineUser } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import api from './api';

const Login = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [isRegister, setIsRegister] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const endpoint = isRegister ? '/auth/register' : '/auth/login';
            const payload = isRegister ? { name, email, password } : { email, password };
            const response = await api.post(endpoint, payload);
            
            if (response.data && response.data.token) {
                const token = response.data.token;
                localStorage.setItem("token", token);
                localStorage.setItem("isLoggedIn", "true");
                localStorage.setItem("userRole", response.data.user?.role || 'user');
                localStorage.setItem("userName", response.data.user?.name || '');
                localStorage.setItem("userEmail", response.data.user?.email || '');
                
                // Set header for immediate subsequent requests
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                
                setSuccess(true);
                const destination = location.state?.from || "/";
                setTimeout(() => navigate(destination), 800);
            } else {
                setError("Login failed: No token received from server.");
            }
        } catch (err) {
            setError(err.response?.data?.error || "Authentication failed");
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center px-6 py-16 bg-transparent relative overflow-hidden">
            {/* Ambient blobs */}
            <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 12, repeat: Infinity }}
                className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(232,72,10,0.10) 0%, transparent 70%)', filter: 'blur(80px)' }} />
            <motion.div animate={{ x: [0, -30, 0], y: [0, 30, 0] }} transition={{ duration: 15, repeat: Infinity }}
                className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(212,160,23,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Card */}
                <div className="card-luxury p-8 md:p-10">
                    {/* Top accent line */}
                    <div className="absolute top-0 left-8 right-8 h-1 rounded-b-full"
                        style={{ background: 'linear-gradient(90deg, #E8480A, #D4A017, #BE185D)' }} />

                    {/* Logo */}
                    <div className="text-center mb-8">
                        <motion.div whileHover={{ rotate: 20 }}
                            className="inline-flex w-16 h-16 rounded-[1.25rem] items-center justify-center mb-5 shadow-xl"
                            style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)', boxShadow: '0 12px 32px rgba(232,72,10,0.35)' }}>
                            <HiOutlineGift className="w-8 h-8 text-white" />
                        </motion.div>

                        <h1 className="font-display text-3xl font-bold text-gray-900 mb-1" style={{ fontStyle: 'italic' }}>
                            {isRegister ? "Join the Family" : "Welcome Back"}
                        </h1>
                        <p className="text-gray-400 text-sm font-medium">
                            {isRegister ? "Create your Jaipur Gifts account" : "Sign in to your account"}
                        </p>
                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">
                                {error}
                            </motion.div>
                        )}
                        {location.state?.from?.pathname && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-orange-600 text-[10px] font-black uppercase tracking-[0.2em]">
                                Please login to continue
                            </motion.p>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div key="success"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8">
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6 }}
                                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl"
                                    style={{ background: 'linear-gradient(135deg, rgba(232,72,10,0.1), rgba(212,160,23,0.1))' }}>
                                    🎉
                                </motion.div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">You're in!</h2>
                                <p className="text-gray-400 text-sm">Welcome to Jaipur Gifts.</p>
                                {location.state?.from && <p className="text-orange-600 text-xs font-bold mt-2">Redirecting to Chat...</p>}
                                <Link to="/" className="inline-block mt-6 px-8 py-3 text-white font-bold rounded-2xl shadow-lg"
                                    style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017)' }}>
                                    Start Shopping
                                </Link>
                            </motion.div>
                        ) : (
                            <motion.form key={isRegister ? 'register' : 'login'}
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSubmit} className="space-y-5">

                                {isRegister && (
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2 ml-1">Full Name</label>
                                        <div className="relative group">
                                            <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-orange-500 transition-colors text-lg" />
                                            <input type="text" placeholder="Priya Sharma" required value={name} onChange={e => setName(e.target.value)}
                                                className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-gray-800 text-sm font-medium outline-none transition-all placeholder:text-gray-300"
                                                style={{ background: 'rgba(232,72,10,0.03)', border: '1.5px solid rgba(0,0,0,0.08)' }}
                                                onFocus={e => e.target.style.borderColor = '#E8480A'}
                                                onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.08)'}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2 ml-1">Email Address</label>
                                    <div className="relative group">
                                        <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-orange-500 transition-colors text-lg" />
                                        <input type="email" placeholder="hello@example.com" value={email} onChange={e => setEmail(e.target.value)} required
                                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-gray-800 text-sm font-medium outline-none transition-all placeholder:text-gray-300"
                                            style={{ background: 'rgba(232,72,10,0.03)', border: '1.5px solid rgba(0,0,0,0.08)' }}
                                            onFocus={e => e.target.style.borderColor = '#E8480A'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.08)'}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2 ml-1">
                                        <label className="text-xs font-black uppercase tracking-wider text-gray-500">Password</label>
                                        {!isRegister && <a href="#" className="text-xs font-bold transition-colors" style={{ color: '#E8480A' }}>Forgot?</a>}
                                    </div>
                                    <div className="relative group">
                                        <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-orange-500 transition-colors text-lg" />
                                        <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
                                            className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-gray-800 text-sm font-medium outline-none transition-all placeholder:text-gray-300"
                                            style={{ background: 'rgba(232,72,10,0.03)', border: '1.5px solid rgba(0,0,0,0.08)' }}
                                            onFocus={e => e.target.style.borderColor = '#E8480A'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.08)'}
                                        />
                                        <button type="button" onClick={() => setShowPass(!showPass)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-orange-500 transition-colors text-lg">
                                            {showPass ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                                        </button>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="w-full py-4 rounded-2xl text-white font-black text-base relative overflow-hidden shadow-xl"
                                    style={{ background: 'linear-gradient(135deg, #E8480A, #D4A017, #BE185D)', backgroundSize: '200% 200%', boxShadow: '0 12px 32px rgba(232,72,10,0.35)' }}
                                >
                                    {isRegister ? "Create Account" : "Sign In"}
                                </motion.button>

                                {/* Divider */}
                                <div className="relative text-center py-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-100" />
                                    </div>
                                    <span className="relative px-4 bg-white text-xs font-bold text-gray-300 uppercase tracking-widest">Or continue with</span>
                                </div>

                                {/* Social */}
                                <div className="flex gap-3">
                                    {[
                                        [<FcGoogle size={18} />, "Google"],
                                        [<FaFacebook size={18} className="text-blue-600" />, "Facebook"],
                                    ].map(([icon, label]) => (
                                        <motion.button key={label} type="button"
                                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                            onClick={() => alert(`${label} login coming soon!`)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border font-bold text-gray-600 text-sm hover:bg-gray-50 transition-all"
                                            style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                                            {icon} {label}
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {!success && (
                        <p className="text-center mt-7 text-gray-400 text-sm font-medium">
                            {isRegister ? "Already have an account? " : "Don't have an account? "}
                            <button onClick={() => setIsRegister(!isRegister)} className="font-black hover:underline transition-colors" style={{ color: '#E8480A' }}>
                                {isRegister ? "Sign In" : "Sign Up"}
                            </button>
                        </p>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
