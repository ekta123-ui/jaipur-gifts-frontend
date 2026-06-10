import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineAdjustments, HiOutlineRefresh, HiOutlineSearch, HiOutlineChevronRight, HiOutlineX, HiOutlineLocationMarker, HiOutlinePhone, HiOutlineCube, HiOutlineUserGroup, HiOutlineChatAlt2, HiOutlineCollection, HiOutlineTrash, HiOutlinePencilAlt } from 'react-icons/hi';
import { orderService, customRequestService, giftService, reviewService } from './api';
import { getPrice } from './formatters.js';
import { allGifts } from './data/gifts.js';
import OrderTimeline from './OrderTimeline';

const statusOptions = ['pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled'];
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
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [customRequests, setCustomRequests] = useState([]);
    const [products, setProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
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
            const [ordersRes, statsRes, customRes, productsRes, reviewsRes] = await Promise.all([
                orderService.fetchAllOrders(),
                orderService.fetchStats(),
                customRequestService.fetchAll(),
                giftService.fetchAdminAll(),
                reviewService.fetchAll(),
            ]);
            setOrders(ordersRes.data.orders || []);
            setStats(statsRes.data.stats || null);
            setCustomRequests(customRes.data.requests || []);
            setProducts(productsRes.data.gifts || []);
            setReviews(reviewsRes.data.reviews || []);
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'dispatched': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'delivered': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'cancelled': return 'text-rose-600 bg-rose-50 border-rose-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    return (
        <div className="min-h-screen px-6 py-28 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="font-display text-5xl font-bold text-gray-900 italic">Order <span className="shimmer-text">Management</span></h1>
                    <p className="text-gray-400 font-medium mt-2">Update gift journeys and manage royal surprises.</p>
                </div>
                <button
                    onClick={loadOrders}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-orange-100 text-orange-600 font-bold shadow-sm hover:shadow-md transition-all"
                >
                    <HiOutlineRefresh className={loading ? "animate-spin" : ""} /> Refresh Data
                </button>
            </div>

            {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 mb-8 font-bold">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-10">
                {[
                    { label: 'Registered Users', value: stats?.totalUsers ?? 0, icon: <HiOutlineUserGroup />, tone: 'text-blue-600 bg-blue-50' },
                    { label: 'Total Logins', value: stats?.totalLogins ?? 0, icon: <HiOutlineUserGroup />, tone: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Orders Placed', value: stats?.totalOrders ?? 0, icon: <HiOutlineCube />, tone: 'text-orange-600 bg-orange-50' },
                    { label: 'Variety Orders', value: stats?.varietyOrders ?? 0, icon: <HiOutlineCollection />, tone: 'text-amber-600 bg-amber-50' },
                    { label: 'Custom Requests', value: stats?.customRequests ?? 0, icon: <HiOutlineChatAlt2 />, tone: 'text-rose-600 bg-rose-50' },
                    { label: 'Revenue', value: getPrice(stats?.totalRevenue ?? 0), icon: <HiOutlineCollection />, tone: 'text-purple-600 bg-purple-50' },
                    { label: 'Live Products', value: stats?.totalProducts ?? 0, icon: <HiOutlineCollection />, tone: 'text-slate-600 bg-slate-50' },
                    { label: 'Review Queue', value: stats?.pendingReviews ?? 0, icon: <HiOutlineChatAlt2 />, tone: 'text-fuchsia-600 bg-fuchsia-50' },
                ].map(item => (
                    <div key={item.label} className="bg-white/80 border border-orange-100 rounded-2xl p-5 shadow-sm">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4 ${item.tone}`}>
                            {item.icon}
                        </div>
                        <p className="text-3xl font-black text-gray-900 leading-none">{item.value}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">{item.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                <div className="bg-white/80 border border-orange-100 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-xl font-black text-gray-900 mb-5">Order Status</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {statusOptions.map(status => (
                            <div key={status} className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                                <p className="text-2xl font-black text-gray-900">{stats?.statusCounts?.[status] || 0}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{status}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/80 border border-orange-100 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-xl font-black text-gray-900 mb-5">Top Categories</h2>
                    <div className="space-y-3">
                        {(stats?.topCategories || []).slice(0, 5).map(category => (
                            <div key={category._id} className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 border border-gray-100 p-3">
                                <span className="font-black text-gray-800 capitalize">{String(category._id).replace('-', ' ')}</span>
                                <span className="text-orange-600 font-black">{category.count}</span>
                            </div>
                        ))}
                        {(!stats?.topCategories || stats.topCategories.length === 0) && (
                            <p className="text-gray-400 font-bold text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">No category data yet.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 mb-10">
                <form onSubmit={handleProductSubmit} className="bg-white/80 border border-orange-100 rounded-2xl p-6 shadow-sm">
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

            <div className="bg-white/80 border border-orange-100 rounded-2xl p-6 shadow-sm mb-10">
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

            <div className="bg-white/80 border border-orange-100 rounded-2xl p-6 shadow-sm mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Customization Requests</h2>
                        <p className="text-sm text-gray-400 font-medium">Messages written in the customize box are saved here.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-black uppercase tracking-widest">
                        {stats?.newCustomRequests ?? 0} New
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

            {/* Filters Row */}
            <div className="flex flex-col lg:flex-row gap-4 mb-10">
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
                                <button
                                    onClick={() => window.open(`https://wa.me/${order.deliveryAddress.phone.replace(/[^0-9]/g, '')}`, '_blank')}
                                    className="p-3 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:scale-105 transition-all"
                                    title="Contact on WhatsApp"
                                >
                                    <HiOutlineChevronRight />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {!loading && filteredOrders.length === 0 && (
                    <div className="text-center py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold">{searchTerm || statusFilter !== 'all' ? "No orders match your search criteria." : "No orders found in the system."}</p>
                    </div>
                )}
            </div>

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
                                            </div>
                                        </div>

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

                                <div className="mt-10">
                                    <button
                                        onClick={() => window.open(`https://wa.me/${selectedOrder.deliveryAddress.phone.replace(/[^0-9]/g, '')}`, '_blank')}
                                        className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-100 transition-transform active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <HiOutlineChevronRight size={20} className="rotate-180" /> Coordinate Journey on WhatsApp
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
