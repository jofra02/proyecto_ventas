import { useState, createContext, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const res = await api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        const { access_token } = res.data;
        const token = access_token; // Ensure this matches response

        // Set headers immediately
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('token', token);

        // Fetch real user info
        try {
            const meRes = await api.get('/auth/me');
            const user = meRes.data;
            setUser(user);
            localStorage.setItem('user', JSON.stringify(user));
            return user; // Return user for immediate navigation
        } catch (err) {
            console.error("Failed to fetch profile", err);
            // Fallback for immediate response if /me fails for some reason
            const fallback = { username, role: 'EMPLOYEE' };
            setUser(fallback);
            return fallback;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/login'; // Force redirect
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
