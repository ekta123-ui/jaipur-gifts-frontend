import axios from 'axios';

const backendBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const api = axios.create({
    baseURL: `${backendBaseUrl}/api`,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Automatically add JWT token to every request if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    // Ensure we don't send the string "null" or "undefined"
    if (token && !['null', 'undefined', ''].includes(token.trim())) {
        config.headers.Authorization = `Bearer ${token.trim()}`;
    } else {
        delete config.headers.Authorization;
    }
    return config;
});

// Automatically handle 401 Unauthorized responses (e.g., token expiration)
api.interceptors.response.use(
    (response) => {
        // Notify that the API is reachable on every successful response
        window.dispatchEvent(new CustomEvent('api-reachable'));
        return response;
    },
    (error) => {
        // Detect network-level errors (server offline, DNS failure, etc.)
        if (!error.response || error.code === 'ERR_NETWORK') {
            window.dispatchEvent(new CustomEvent('api-unreachable'));
        }

        if (error.response && error.response.status === 401) {
            if (!window.location.pathname.includes('/login')) {
                console.warn("Session expired or unauthorized. Logging out...");
                logout();
            }
        }
        return Promise.reject(error);
    }
);

export const logout = () => {
    // Clear all auth-related items from local storage
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    
    // Clear the default Authorization header
    delete api.defaults.headers.common['Authorization'];
    
    // Force a page reload to the login screen to clear internal state
    window.location.href = '/login';
};

export const orderService = {
    placeOrder: async (orderData) => {
        try {
            const response = await api.post('/orders', orderData);
            return response.data;
        } catch (error) {
            console.error("📦 API Order Error:", JSON.stringify(error.response?.data, null, 2) || error.message);
            throw error;
        }
    },

    // User: Fetch personal orders
    fetchMyOrders: () => api.get('/orders/my'),

    // Admin: Fetch all orders
    fetchAllOrders: () => api.get('/orders'),

    // Admin: Fetch dashboard totals
    fetchStats: () => api.get('/orders/stats/summary'),

    // Admin: Update status (e.g., 'confirmed' to 'dispatched')
    updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
    uploadOrderImage: (formData) => api.post('/orders/upload-image', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),

    // Updated to use the public tracking route /api/orders/track/:id
    fetchOrderStatus: (orderId) => api.get(`/orders/track/${orderId}`),
};

export const giftService = {
    // Fetches gifts with filtering and pagination (public facing)
    fetchAll: (params = {}) => api.get('/gifts', { params }),
    // Fetches all gifts without filters (admin only, includes unavailable)
    fetchAdminAll: () => api.get('/gifts/debug/all'),
    create: (giftData) => api.post('/gifts', giftData),
    update: (giftId, giftData) => api.put(`/gifts/${giftId}`, giftData),
    remove: (giftId) => api.delete(`/gifts/${giftId}`),
};

export const reviewService = {
    fetchForGift: (giftId) => api.get(`/reviews/gift/${giftId}`),
    submit: (reviewData) => api.post('/reviews', reviewData),
    fetchAll: () => api.get('/reviews'),
    publish: (id) => api.patch(`/reviews/${id}/publish`),
    remove: (id) => api.delete(`/reviews/${id}`),
};

export const customRequestService = {
    create: (requestData) => api.post('/custom-requests', requestData),
    fetchAll: () => api.get('/custom-requests'),
    updateStatus: (id, status) => api.patch(`/custom-requests/${id}/status`, { status }),
};

export const homepageService = {
    fetchMostBoughtGifts: (limit = 10) => api.get(`/orders/most-bought`, { params: { limit } }),
};

export const adminService = {
    fetchDashboard: () => api.get('/admin/dashboard'),
    fetchUsers: () => api.get('/admin/users'),
    updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    savePushSubscription: (subscription) => api.post('/admin/push-subscribe', subscription),
};

export default api;
