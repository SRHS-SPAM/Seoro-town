import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const verifyStoredToken = async () => {
                try {
                    const response = await fetch('/api/users/me', {
                        headers: { 'Authorization': `Bearer ${storedToken}` },
                    });
                    const data = await response.json();
                    if (data.success) {
                        setUser(data.user);
                    } else {
                        localStorage.removeItem('token');
                        setToken(null);
                        setUser(null);
                    }
                } catch (error) {
                    console.error('저장된 토큰 검증 실패:', error);
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                } finally {
                    setIsLoading(false);
                }
            };
            verifyStoredToken();
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = (userData, userToken) => {
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const authContextValue = {
        user,
        token,
        isLoggedIn: !!user,
        isLoading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};