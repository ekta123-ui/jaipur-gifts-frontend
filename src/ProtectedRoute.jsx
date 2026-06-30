import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const token = localStorage.getItem('token')?.trim();
    const role = localStorage.getItem('userRole');
    const location = useLocation();

    // Check if token exists and isn't a string representation of null/undefined
    const isAuthenticated = token && token !== 'null' && token !== 'undefined';

    if (!isAuthenticated) {
        // Redirect to login, but save the current location so we can redirect back after login
        const destination = adminOnly ? '/admin/login' : '/login';
        return <Navigate to={destination} state={{ from: location }} replace />;
    }

    // RBAC: If route requires admin and user is not an admin, redirect to admin login
    if (adminOnly && role !== 'admin') {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
