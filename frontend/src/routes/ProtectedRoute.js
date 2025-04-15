import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" replace />;
    }

    // Check if user has an allowed role
    if (allowedRoles && (!user?.role || !allowedRoles.includes(user.role))) {
        // User doesn't have required role, redirect to default route based on their role
        if (user?.role === 'doctor') {
            return <Navigate to="/doctor/dashboard" replace />;
        } else if (user?.role === 'dgtt_admin' || user?.role === 'dgtt_staff') {
            return <Navigate to="/admin/dashboard" replace />;
        } else {
            // Fallback to login if role is unexpected
            return <Navigate to="/login" replace />;
        }
    }

    // User is authenticated and has appropriate role, render children
    return <Outlet />;
};

export default ProtectedRoute;