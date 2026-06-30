import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineGift } from 'react-icons/hi';
import api from '../api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      if (!token) {
        setError('Unable to authenticate. Please try again.');
        return;
      }

      if (user?.role !== 'admin') {
        setError('Admin access only. Please log in with an admin account.');
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('userName', user?.name || 'Admin');
      localStorage.setItem('userEmail', user?.email || email);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const destination = location.state?.from?.pathname || '/admin/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials or network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-6 py-16 bg-slate-50 relative overflow-hidden">
      <motion.div animate={{ x: [0, -20, 0], y: [0, 20, 0] }} transition={{ duration: 15, repeat: Infinity }}
        className="absolute top-0 left-0 w-[420px] h-[420px] rounded-full pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(232,72,10,0.10) 0%, transparent 70%)', filter: 'blur(120px)' }} />
      <motion.div animate={{ x: [0, 20, 0], y: [0, -20, 0] }} transition={{ duration: 18, repeat: Infinity }}
        className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(212,160,23,0.10) 0%, transparent 70%)', filter: 'blur(120px)' }} />

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.55 }}
        className="relative z-10 w-full max-w-md">
        <div className="rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-2xl shadow-slate-200/40 backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-200">
              <HiOutlineGift className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Admin Portal</h1>
            <p className="mt-2 text-sm text-slate-500">Secure access for Jaipur Gifts administrators only.</p>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-2">Admin Email</label>
              <div className="relative">
                <HiOutlineMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jaipur.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Password</label>
              </div>
              <div className="relative">
                <HiOutlineLockClosed className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                >
                  {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-fuchsia-500 px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-lg shadow-orange-200 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Verifying...' : 'Sign in as Admin'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            <p className="mb-3">Need a customer login instead?</p>
            <Link to="/login" className="font-semibold text-orange-600 hover:text-orange-700">
              Go to customer login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
