import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { HiOutlineAdjustments, HiOutlineRefresh, HiOutlineSearch, HiOutlineX, HiOutlineLocationMarker, HiOutlinePhone, HiOutlineCube, HiOutlineUserGroup, HiOutlineChatAlt2, HiOutlineCollection, HiOutlineTrash, HiOutlinePencilAlt, HiOutlineChartBar, HiOutlineUsers, HiOutlineShoppingBag, HiOutlineStar, HiOutlineInboxIn, HiOutlineBell, HiOutlineCurrencyRupee, HiOutlineCalendar, HiOutlineIdentification, HiOutlineTruck } from 'react-icons/hi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { orderService, customRequestService, giftService, reviewService, adminService } from '../api';
import { getPrice } from '../formatters.js';
import { allGifts } from '../data/gifts.js';
import OrderTimeline from '../OrderTimeline';

const statusOptions = ['pending', 'confirmed', 'processing', 'completed', 'delivered', 'cancelled'];
const customStatusOptions = ['new', 'contacted', 'converted', 'closed'];
const categoryOptions = ['birthday', 'anniversary', 'baby-shower', 'groom-to-be', 'bride-to-be', 'wedding', 'friendship', 'appreciation'];
const emptyProductForm = {
    giftId: '',
    name: '',
    category: 'birthday',
    tag: '',
    description: '',
    priceAmount: '',
    stock: 100,
    imgUrl: '',
    detailsText: '',
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [orders, setOrders] = useState([]);
    const [dashboardData, setDashboardData] = useState(null);
    const [customRequests, setCustomRequests] = useState([]);
    const [products, setProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [users, setUsers] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    
    // Helper for Web Push
    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const [productForm, setProductForm] = useState(emptyProductForm);
    const [editingGiftId, setEditingGiftId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Filter logic: Search by ID or Customer Name + Status Filter
    const filteredOrders = orders.filter(order => {
        const matchesSearch = order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.deliveryAddress.fullName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            const [ordersRes, dashRes, customRes, productsRes, reviewsRes, usersRes] = await Promise.all([
                orderService.fetchAllOrders(),
                adminService.fetchDashboard(),
                customRequestService.fetchAll(),
                giftService.fetchAdminAll(),
                reviewService.fetchAll(),
                adminService.fetchUsers(),
            ]);
            setOrders(ordersRes.data.orders || []);
            setDashboardData(dashRes.data || null);
            setCustomRequests(customRes.data.requests || []);
            setProducts(productsRes.data.gifts || []);
            setReviews(reviewsRes.data.reviews || []);
            setUsers(usersRes.data.users || []);
        } catch {
            setError('Failed to load orders. Ensure you are logged in as an admin.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(loadOrders, 0);
        return () => clearTimeout(timer);
    }, [loadOrders]);

    // Socket.io Real-time Setup
    useEffect(() => {
        const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/i, '') || 'http://localhost:5000';
        const socket = io(socketUrl, {
            auth: { token: localStorage.getItem('token') }
        });

        socket.on('connect', () => {
            socket.emit('join_admin', { token: localStorage.getItem('token') });
        });

        socket.on('admin_order_notification', (data) => {
            setNotifications(prev => [data, ...prev].slice(0, 5)); // Keep last 5
            // Optional: Play notification sound
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {});
            
            // Auto-refresh stats if on overview
            if (activeTab === 'overview') {
                adminService.fetchDashboard().then(res => setDashboardData(res.data));
            }
        });

        socket.on('admin_join_denied', (err) => {
            setError('Real-time connection failed: ' + err.error);
        });

        return () => {
            socket.disconnect();
        };
    }, [activeTab, loadOrders]);

    // Web Push Registration
    useEffect(() => {
        const setupPush = async () => {
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    const permission = await Notification.requestPermission();
                    
                    if (permission === 'granted') {
                        const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
                        if (!publicKey) return;

                        const subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(publicKey)
                        });
                        
                        await adminService.savePushSubscription(subscription);
                    }
                } catch (err) {
                    console.error("Push subscription failed:", err);
                }
            }
        };
        setupPush();
    }, []);

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await orderService.updateOrderStatus(orderId, newStatus);
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        } catch (err) {
            alert("Failed to update status: " + (err.response?.data?.error || err.message));
        }
    };

    const handleCustomStatusUpdate = async (requestId, newStatus) => {
        try {
            await customRequestService.updateStatus(requestId, newStatus);
            setCustomRequests(prev => prev.map(item => item._id === requestId ? { ...item, status: newStatus } : item));
        } catch (err) {
            alert("Failed to update customization status: " + (err.response?.data?.error || err.message));
        }
    };

    const toGiftPayload = () => ({
        giftId: productForm.giftId.trim(),
        name: productForm.name.trim(),
        category: productForm.category,
        tag: productForm.tag.trim(),
        description: productForm.description.trim(),
        price: {
            amount: Number(productForm.priceAmount) || 0,
            display: getPrice(Number(productForm.priceAmount) || 0),
            currency: 'INR',
        },
        stock: Number(productForm.stock) || 0,
        imgUrl: productForm.imgUrl,
        details: productForm.detailsText.split('\n').map(item => item.trim()).filter(Boolean),
        isAvailable: true,
    });

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = toGiftPayload();
            if (editingGiftId) {
                await giftService.update(editingGiftId, payload);
            } else {
                await giftService.create(payload);
            }
            setProductForm(emptyProductForm);
            setEditingGiftId(null);
            const productsRes = await giftService.fetchAdminAll();
            setProducts(productsRes.data.gifts || []);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to save product.');
        }
    };

    const handleProductEdit = (gift) => {
        setEditingGiftId(gift.giftId);
        setProductForm({
            giftId: gift.giftId || '',
            name: gift.name || '',
            category: gift.category || 'birthday',
            tag: gift.tag || '',
            description: gift.description || '',
            priceAmount: gift.price?.amount || '',
            stock: gift.stock ?? 100,
            imgUrl: gift.imgUrl || '',
            detailsText: (gift.details || []).join('\n'),
        });
    };

    const handleProductDelete = async (giftId) => {
        if (!window.confirm('Remove this gift from public listing?')) return;
        try {
            await giftService.remove(giftId);
            setProducts(prev => prev.map(item => item.giftId === giftId ? { ...item, isAvailable: false } : item));
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to remove product.');
        }
    };

    const handleImageFile = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setProductForm(prev => ({ ...prev, imgUrl: reader.result }));
        reader.readAsDataURL(file);
    };

    const handleReviewPublish = async (reviewId) => {
        try {
            await reviewService.publish(reviewId);
            setReviews(prev => prev.map(review => review._id === reviewId ? { ...review, isPublished: true } : review));
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to publish review.');
        }
    };

    const handleReviewDelete = async (reviewId) => {
        try {
            await reviewService.remove(reviewId);
            setReviews(prev => prev.filter(review => review._id !== reviewId));
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to remove review.');
        }
    };

    const handleUserToggleStatus = async (user) => {
        const newStatus = user.status === 'disabled' ? 'active' : 'disabled';
        await adminService.updateUser(user._id, { status: newStatus });
        setUsers(prev => prev.map(u => u._id === user._id ? { ...u, status: newStatus } : u));
    };

    const handleUserDelete = async (userId) => {
        if (!window.confirm('Delete this user permanently? This cannot be undone.')) return;
        try {
            await adminService.deleteUser(userId);
            setUsers(prev => prev.filter(u => u._id !== userId));
        } catch (err) { alert('Failed to delete user.'); }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'dispatched': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'delivered': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'cancelled': return 'text-rose-600 bg-rose-50 border-rose-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    const COLORS = ['#E8480A', '#D4A017', '#BE185D', '#475569', '#059669'];

    const renderStats = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
                { label: 'Total Revenue', value: getPrice(dashboardData?.totalRevenue), icon: <HiOutlineCurrencyRupee />, color: 'bg-green-50 text-green-600' },
                { label: 'Total Orders', value: dashboardData?.totalOrders, icon: <HiOutlineShoppingBag />, color: 'bg-blue-50 text-blue-600' },
                { label: 'Active Users', value: dashboardData?.activeUsers, icon: <HiOutlineUsers />, color: 'bg-purple-50 text-purple-600' },
                { label: 'Total Products', value: dashboardData?.totalProducts, icon: <HiOutlineCube />, color: 'bg-orange-50 text-orange-600' }
            ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 ${stat.color}`}>
                        {stat.icon}
                    </div>
                    <h3 className="text-3xl font-black text-gray-900">{stat.value || 0}</h3>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                </div>
            ))}
        </div>
    );

    const renderCharts = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <h3 className="text-lg font-black text-gray-900 mb-6">Revenue Analytics</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashboardData?.charts?.revenue}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#E8480A" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#E8480A" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                            <Tooltip />
                            <Area type="monotone" dataKey="value" stroke="#E8480A" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center">
                <h3 className="text-lg font-black text-gray-900 mb-6 w-full text-left">Category Sales</h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={dashboardData?.charts?.categories} 
                                innerRadius={60} 
                                outerRadius={100} 
                                dataKey="count" 
                                nameKey="_id"
                                paddingAngle={5}
                            >
                                {dashboardData?.charts?.categories?.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex bg-gray-50/50">
            {/* Sidebar Navigation */}
            <aside className="w-72 bg-white border-r border-gray-100 p-6 flex flex-col gap-8 fixed h-full z-20">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-100">
                        <HiOutlineAdjustments size={24} />
                    </div>
                    <span className="font-display text-xl font-bold tracking-tight">Admin<span className="text-orange-600">Core</span></span>
                </div>

                <nav className="flex flex-col gap-1">
                    {[
                        { id: 'overview', label: 'Dashboard', icon: <HiOutlineChartBar /> },
                        { id: 'analytics', label: 'Analytics', icon: <HiOutlineAdjustments /> },
                        { id: 'orders', label: 'Orders', icon: <HiOutlineShoppingBag /> },
                        { id: 'users', label: 'Users', icon: <HiOutlineUsers /> },
                        { id: 'products', label: 'Inventory', icon: <HiOutlineCollection /> },
                        { id: 'moderation', label: 'Moderation', icon: <HiOutlineStar /> },
                        { id: 'requests', label: 'Custom Requests', icon: <HiOutlineInboxIn /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 ml-72 p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="font-display text-5xl font-bold text-gray-900 italic">Order <span className="shimmer-text">Management</span></h1>
                    <p className="text-gray-400 font-medium mt-2">Update gift journeys and manage royal surprises.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`p-3 rounded-2xl bg-white border border-gray-100 text-gray-500 hover:text-orange-600 transition-all relative ${notifications.length > 0 ? 'animate-bounce-short' : ''}`}
                        >
                            <HiOutlineBell size={24} />
                            {notifications.length > 0 && (
                                <span className="absolute top-2 right-2 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></span>
                            )}
                        </button>
                        
                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 z-50"
                                >
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 px-2">Live Alerts</h4>
                                    <div className="space-y-2">
                                        {notifications.length === 0 ? (
                                            <p className="text-center py-4 text-sm text-gray-400 italic">No new alerts.</p>
                                        ) : (
                                            notifications.map((n, i) => (
                                                <div key={i} className="p-3 rounded-2xl bg-orange-50/50 border border-orange-100/50">
                                                    <p className="text-sm font-bold text-gray-900">New Order Placed!</p>
                                                    <p className="text-xs text-gray-500 mt-1">{n.customerName} • {getPrice(n.amount)}</p>
                                                    <p className="text-[10px] text-orange-600 font-bold mt-1">{n.timestamp}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button
                        onClick={loadOrders}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-orange-100 text-orange-600 font-bold shadow-sm hover:shadow-md transition-all"
                    >
                        <HiOutlineRefresh className={loading ? "animate-spin" : ""} /> Refresh Data
                    </button>
                </div>
            </div>

            {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 mb-8 font-bold">{error}</div>}

            {activeTab === 'overview' && (
                <div className="space-y-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Revenue', value: getPrice(dashboardData?.totalRevenue ?? 0), icon: <HiOutlineChartBar />, tone: 'text-purple-600 bg-purple-50' },
                            { label: 'Monthly Revenue', value: getPrice(dashboardData?.monthlyRevenue ?? 0), icon: <HiOutlineChartBar />, tone: 'text-orange-600 bg-orange-50' },
                            { label: 'Total Orders', value: dashboardData?.totalOrders ?? 0, icon: <HiOutlineShoppingBag />, tone: 'text-blue-600 bg-blue-50' },
                            { label: 'Active Users', value: dashboardData?.activeUsers ?? 0, icon: <HiOutlineUsers />, tone: 'text-emerald-600 bg-emerald-50' },
                        ].map(item => (
                            <div key={item.label} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 ${item.tone}`}>
                                    {item.icon}
                                </div>
                                <p className="text-3xl font-black text-gray-900">{item.value}</p>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">{item.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                            <h2 className="text-xl font-black text-gray-900 mb-8">Revenue Growth</h2>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dashboardData?.charts?.revenue}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#E8480A" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#E8480A" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="value" stroke="#E8480A" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                            <h2 className="text-xl font-black text-gray-900 mb-8">Order Distribution</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {statusOptions.map(status => (
                                    <div key={status} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                        <p className="text-2xl font-black text-gray-900">{dashboardData?.statusDistribution?.[status] || 0}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{status}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                        <h2 className="text-2xl font-black text-gray-900">Royal Patrons</h2>
                        <span className="px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">{users.length} Users</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <tr>
                                    <th className="px-8 py-4">User</th>
                                    <th className="px-8 py-4">Joined</th>
                                    <th className="px-8 py-4">Orders</th>
                                    <th className="px-8 py-4">Status</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map(user => (
                                    <tr key={user._id} className="group hover:bg-gray-50/30 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="font-bold text-gray-900">{user.name}</p>
                                            <p className="text-xs text-gray-400 font-medium">{user.email}</p>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td className="px-8 py-5">
                                            <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-xs">{user.orderCount || 0}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.status === 'disabled' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {user.status || 'active'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleUserToggleStatus(user)}
                                                    className="w-9 h-9 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-orange-600 transition-colors"
                                                >
                                                    <HiOutlineAdjustments />
                                                </button>
                                                <button 
                                                    onClick={() => handleUserDelete(user._id)}
                                                    className="w-9 h-9 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-rose-600 transition-colors"
                                                >
                                                    <HiOutlineTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                        <h2 className="text-xl font-black text-gray-900 mb-8 text-center">Top Categories by Sales</h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={dashboardData?.topCategories} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="count" nameKey="_id">
                                        {dashboardData?.topCategories?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'products' && (
                <>
                <div className="bg-white/80 border border-orange-100 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-xl font-black text-gray-900 mb-5">Top Categories</h2>
                    <div className="space-y-3">
                        {(dashboardData?.topCategories || []).slice(0, 5).map(category => (
                            <div key={category._id} className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 border border-gray-100 p-3">
                                <span className="font-black text-gray-800 capitalize">{String(category._id).replace('-', ' ')}</span>
                                <span className="text-orange-600 font-black">{category.count}</span>
                            </div>
                        ))}
                        {(!dashboardData?.topCategories || dashboardData.topCategories.length === 0) && (
                            <p className="text-gray-400 font-bold text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">No category data yet.</p>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 mt-10">
                <form onSubmit={handleProductSubmit} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm h-fit">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-xl font-black text-gray-900">{editingGiftId ? 'Edit Gift' : 'Add Gift'}</h2>
                            <p className="text-sm text-gray-400 font-medium">Create products with image upload and stock.</p>
                        </div>
                        {editingGiftId && (
                            <button
                                type="button"
                                onClick={() => { setProductForm(emptyProductForm); setEditingGiftId(null); }}
                                className="text-xs font-black text-orange-600"
                            >
                                New
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        <input required value={productForm.giftId} onChange={(e) => setProductForm(prev => ({ ...prev, giftId: e.target.value }))} placeholder="Gift ID e.g. B-101" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 text-sm font-medium" />
                        <input required value={productForm.name} onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Gift name" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 text-sm font-medium" />
                        <div className="grid grid-cols-2 gap-3">
                            <select value={productForm.category} onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))} className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 text-sm font-bold">
                                {categoryOptions.map(category => <option key={category} value={category}>{category}</option>)}
                            </select>
                            <input value={productForm.tag} onChange={(e) => setProductForm(prev => ({ ...prev, tag: e.target.value }))} placeholder="Tag" className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 text-sm font-medium" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input required type="number" value={productForm.priceAmount} onChange={(e) => setProductForm(prev => ({ ...prev, priceAmount: e.target.value }))} placeholder="Price" className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 text-sm font-medium" />
                            <input type="number" value={productForm.stock} onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))} placeholder="Stock" className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 text-sm font-medium" />
                        </div>
                        <textarea value={productForm.description} onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Description" rows="3" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 text-sm font-medium resize-none" />
                        <textarea value={productForm.detailsText} onChange={(e) => setProductForm(prev => ({ ...prev, detailsText: e.target.value }))} placeholder="Features, one per line" rows="3" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 text-sm font-medium resize-none" />
                        <input value={productForm.imgUrl} onChange={(e) => setProductForm(prev => ({ ...prev, imgUrl: e.target.value }))} placeholder="Image URL or uploaded image data" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-orange-500 text-sm font-medium" />
                        <input type="file" accept="image/*" onChange={(e) => handleImageFile(e.target.files?.[0])} className="w-full text-sm font-bold text-gray-500" />
                        {productForm.imgUrl && (
                            <img src={productForm.imgUrl} alt="Product preview" className="w-full h-36 object-cover rounded-xl border border-orange-100" />
                        )}
                        <button className="btn-primary w-full">{editingGiftId ? 'Update Gift' : 'Create Gift'}</button>
                    </div>
                </form>

                <div className="bg-white/80 border border-orange-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-5">
                        <div>
                            <h2 className="text-xl font-black text-gray-900">Product Management</h2>
                            <p className="text-sm text-gray-400 font-medium">Edit, hide, and manage store catalog.</p>
                        </div>
                        <span className="text-xs font-black text-gray-400">{products.length} total</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[620px] overflow-y-auto pr-1">
                        {products.map(gift => (
                            <div key={gift.giftId} className={`rounded-xl border p-3 flex gap-3 ${gift.isAvailable ? 'border-gray-100 bg-gray-50/70' : 'border-rose-100 bg-rose-50/40'}`}>
                                <img src={gift.imgUrl || '/images/placeholder.jpg'} alt={gift.name} onError={(e) => { e.target.src = '/images/placeholder.jpg'; }} className="w-16 h-16 rounded-lg object-cover bg-white" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-gray-900 truncate">{gift.name}</p>
                                    <p className="text-xs text-gray-400 font-bold">{gift.giftId} - {gift.category}</p>
                                    <p className="text-sm text-orange-600 font-black">{getPrice(gift.price)}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => handleProductEdit(gift)} className="w-9 h-9 rounded-lg bg-white text-orange-600 flex items-center justify-center border border-orange-100">
                                        <HiOutlinePencilAlt />
                                    </button>
                                    <button onClick={() => handleProductDelete(gift.giftId)} className="w-9 h-9 rounded-lg bg-white text-rose-600 flex items-center justify-center border border-rose-100">
                                        <HiOutlineTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                </div>
                </>
            )}

            {activeTab === 'moderation' && (
                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-5">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Review Approval</h2>
                        <p className="text-sm text-gray-400 font-medium">Publish good reviews or remove unsuitable ones.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-fuchsia-50 text-fuchsia-600 text-xs font-black uppercase tracking-widest">
                        {reviews.filter(review => !review.isPublished).length} Pending
                    </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {reviews.slice(0, 8).map(review => (
                        <div key={review._id} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                    <p className="font-black text-gray-900">{review.name || review.user?.name || 'Customer'}</p>
                                    <p className="text-xs text-gray-400 font-bold">{review.giftId} - {review.rating} stars</p>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${review.isPublished ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {review.isPublished ? 'Published' : 'Pending'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                            <div className="flex gap-2 mt-4">
                                {!review.isPublished && (
                                    <button onClick={() => handleReviewPublish(review._id)} className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-black">Publish</button>
                                )}
                                <button onClick={() => handleReviewDelete(review._id)} className="px-3 py-2 rounded-lg bg-rose-50 text-rose-600 text-xs font-black">Remove</button>
                            </div>
                        </div>
                    ))}
                    {!loading && reviews.length === 0 && (
                        <div className="lg:col-span-2 text-center py-10 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 font-bold">
                            No reviews yet.
                        </div>
                    )}
                </div>
                </div>
            )}

            {activeTab === 'requests' && (
                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Customization Requests</h2>
                        <p className="text-sm text-gray-400 font-medium">Messages written in the customize box are saved here.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-black uppercase tracking-widest">
                        {dashboardData?.newCustomRequests ?? 0} New
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {customRequests.slice(0, 6).map(request => (
                        <div key={request._id} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div>
                                    <p className="font-black text-gray-900">{request.name || request.user?.name || 'Guest Customer'}</p>
                                    <p className="text-xs text-gray-400 font-bold">{request.email || request.user?.email || 'No email saved'}</p>
                                </div>
                                <select
                                    value={request.status}
                                    onChange={(e) => handleCustomStatusUpdate(request._id, e.target.value)}
                                    className="px-3 py-2 rounded-lg bg-white border border-gray-100 text-xs font-bold text-gray-700 outline-none"
                                >
                                    {customStatusOptions.map(status => (
                                        <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{request.message}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-3">
                                {new Date(request.createdAt).toLocaleString()}
                            </p>
                        </div>
                    ))}

                    {!loading && customRequests.length === 0 && (
                        <div className="lg:col-span-2 text-center py-10 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 font-bold">
                            No customization requests yet.
                        </div>
                    )}
                </div>
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="space-y-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                    <HiOutlineSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by Order ID or Customer Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-gray-100 outline-none focus:border-orange-500 shadow-sm transition-all font-medium text-gray-800"
                        style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' }}
                    />
                </div>

                <div className="relative min-w-[200px]">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-6 pr-10 py-4 rounded-2xl bg-white border border-gray-100 outline-none focus:border-orange-500 shadow-sm transition-all font-bold text-gray-700 appearance-none cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' }}
                    >
                        <option value="all">All Statuses</option>
                        {statusOptions.map(opt => (
                            <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                        ))}
                    </select>
                    <HiOutlineAdjustments className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <AnimatePresence mode='popLayout'>
                    {filteredOrders.map((order) => (
                        <motion.div
                            key={order._id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => setSelectedOrder(order)}
                            className="card-luxury p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 cursor-pointer group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-orange-50 border border-orange-100 shrink-0 shadow-sm">
                                    <img
                                        src={order.items[0]?.imgUrl || allGifts.find(g => g.giftId === order.items[0]?.giftId || g.name === order.items[0]?.name)?.imgUrl || "/images/placeholder.jpg"}
                                        alt={order.items[0]?.name || "Order Item"}
                                        onError={(e) => { e.target.src = "/images/placeholder.jpg"; }}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-tighter">ID: {order._id.slice(-6)}</span>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight">
                                        {order.items[0]?.name || "Custom Order"}
                                        {order.items.length > 1 && <span className="text-gray-400 ml-2">+{order.items.length - 1} more</span>}
                                    </h3>
                                    <p className="text-gray-500 text-sm font-medium mt-1">
                                        Customer: <span className="text-gray-900">{order.deliveryAddress.fullName}</span> • <span className="text-orange-600 font-bold">{getPrice(order.totalAmount)}</span>
                                    </p>
                                </div>
                            </div>

                            <div 
                                className="flex items-center gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-100"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="relative flex-1 md:flex-none">
                                    <select
                                        value={order.status}
                                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                        className="w-full md:w-48 pl-4 pr-10 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold text-gray-700 outline-none focus:border-orange-500 appearance-none cursor-pointer"
                                    >
                                        {statusOptions.map(opt => (
                                            <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                                        ))}
                                    </select>
                                    <HiOutlineAdjustments className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {/* End of grid grid-cols-1 */}
                </div> 

                {!loading && filteredOrders.length === 0 && (
                    <div className="text-center py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold">{searchTerm || statusFilter !== 'all' ? "No orders match your search criteria." : "No orders found in the system."}</p>
                    </div>
                )}
                {/* End of space-y-6 */}
                </div> 
            )}

            {/* Order Detail Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-orange-100"
                        >
                            <div className="p-8 md:p-10 max-h-[85vh] overflow-y-auto custom-scrollbar">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">Royal Order Intelligence</p>
                                        <h2 className="text-xl font-black text-gray-900 uppercase">ID: {selectedOrder._id}</h2>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-orange-600 transition-colors"
                                    >
                                        <HiOutlineX size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {/* Left: Items */}
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                                                <HiOutlineCube className="text-orange-500" /> Manifest of Treasures
                                            </h4>
                                            <div className="space-y-4">
                                                {selectedOrder.items.map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                                                        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-white shadow-sm">
                                                            <img
                                                                src={item.imgUrl || allGifts.find(g => g.giftId === item.giftId || g.name === item.name)?.imgUrl || "/images/placeholder.jpg"}
                                                                alt={item.name}
                                                                onError={(e) => { e.target.src = "/images/placeholder.jpg"; }}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-gray-900 leading-tight">{item.name}</p>
                                                            {item.customMessage && (
                                                                <p className="text-xs text-orange-600 mt-1"><strong>Msg:</strong> {item.customMessage}</p>
                                                            )}
                                                            {item.specialInstructions && (
                                                                <p className="text-xs text-gray-500 italic mt-1">Note: {item.specialInstructions}</p>
                                                            )}
                                                            <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-tighter">
                                                                {item.quantity} Unit{item.quantity > 1 ? 's' : ''} • {getPrice(item.price)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Logistics & Customer */}
                                    <div className="space-y-8">
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                                                <HiOutlineLocationMarker className="text-orange-500" /> Royal Destination
                                            </h4>
                                            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100">
                                                <p className="text-sm font-bold text-gray-900">{selectedOrder.deliveryAddress.fullName}</p>
                                                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                                    {selectedOrder.deliveryAddress.addressLine1}<br />
                                                    {selectedOrder.deliveryAddress.city} - {selectedOrder.deliveryAddress.pincode}
                                                </p>
                                                <div className="flex items-center gap-2 mt-4 text-orange-600 font-bold text-sm">
                                                    <HiOutlinePhone />
                                                    <span>{selectedOrder.deliveryAddress.phone}</span>
                                                </div>

                                                <div className="mt-6 space-y-3 text-sm text-gray-700">
                                                    {selectedOrder.occasion && (
                                                        <p><strong>Occasion:</strong> {selectedOrder.occasion}</p>
                                                    )}
                                                    {selectedOrder.recipientName && (
                                                        <p><strong>Recipient:</strong> {selectedOrder.recipientName}</p>
                                                    )}
                                                    {selectedOrder.giftNote && (
                                                        <p><strong>Gift Note:</strong> {selectedOrder.giftNote}</p>
                                                    )}
                                                    {selectedOrder.orderMessage && (
                                                        <p><strong>Personalized Message:</strong> {selectedOrder.orderMessage}</p>
                                                    )}
                                                    {selectedOrder.specialInstructions && (
                                                        <p><strong>Instructions:</strong> {selectedOrder.specialInstructions}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {selectedOrder.uploadedImage && (
                                            <div className="rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                                                <p className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-gray-500 border-b border-gray-100">Inspiration Image</p>
                                                <img
                                                    src={selectedOrder.uploadedImage}
                                                    alt="Uploaded order inspiration"
                                                    className="w-full h-56 object-cover"
                                                />
                                            </div>
                                        )}

                                        <div className="pt-6 border-t border-gray-100">
                                            <OrderTimeline status={selectedOrder.status} />
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Current State</p>
                                                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${getStatusColor(selectedOrder.status)}`}>
                                                        {selectedOrder.status}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-800 mb-1">Total Royal Amount</p>
                                                    <p className="text-3xl font-black text-orange-600 leading-none">{getPrice(selectedOrder.totalAmount)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
        </div>
    );
};

export default AdminDashboard;
