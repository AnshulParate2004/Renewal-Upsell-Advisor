import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
    // Simple check for now. In real app, verify token validity.
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
