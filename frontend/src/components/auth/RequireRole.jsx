import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const RequireRole = ({ children, roles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return null;

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roles && !roles.includes(user.role)) {
        // If Employee tries to access Admin route, send them to POS
        if (user.role === 'EMPLOYEE') {
            return <Navigate to="/pos" replace />;
        }
        // Otherwise generic unauthorized (or Dashboard)
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RequireRole;
