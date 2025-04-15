import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
    return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState(null);

    // Check for saved token on mount
    useEffect(() => {
        const checkAuth = async () => {
            setIsLoading(true);
            try {
                // Try to get token from local storage
                const savedToken = localStorage.getItem('token');
                const savedUser = JSON.parse(localStorage.getItem('user') || 'null');

                if (savedToken && savedUser) {
                    // Token exists, set authenticated state
                    setToken(savedToken);
                    setUser(savedUser);
                    setIsAuthenticated(true);
                } else {
                    // No token, ensure clean state
                    setUser(null);
                    setIsAuthenticated(false);
                    setToken(null);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                // On error, reset auth state
                setUser(null);
                setIsAuthenticated(false);
                setToken(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Login function
    const login = (userData, userToken) => {
        // Save to state
        setUser(userData);
        setToken(userToken);
        setIsAuthenticated(true);

        // Save to local storage for persistence
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    // Logout function
    const logout = () => {
        // Clear state
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);

        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    // Create memo value to avoid unnecessary re-renders
    const value = useMemo(() => ({
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
        setUser,
        setIsAuthenticated
    }), [user, token, isAuthenticated, isLoading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;