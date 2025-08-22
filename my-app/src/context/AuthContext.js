// src/context/AuthContext.js (수정된 최종 버전)

import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const restoreAuthData = async () => {
            try {
                const savedToken = localStorage.getItem('token') || localStorage.getItem('authToken');
                const savedUser = localStorage.getItem('authUser');
                
                if (savedToken) {
                    const validationResult = await validateToken(savedToken);
                    if (validationResult.isValid) {
                        let userData = null;
                        
                        if (savedUser) {
                            try {
                                userData = JSON.parse(savedUser);
                            } catch (e) {
                                console.warn('저장된 사용자 데이터 파싱 실패:', e);
                                userData = validationResult.userData;
                            }
                        } else {
                            userData = validationResult.userData;
                        }
                        
                        if (userData) {
                            setToken(savedToken);
                            setUser(userData);
                            setIsLoggedIn(true);
                            
                            localStorage.setItem('token', savedToken);
                            localStorage.setItem('authToken', savedToken);
                            localStorage.setItem('authUser', JSON.stringify(userData));
                        }
                    } else {
                        clearAuthData();
                    }
                }
            } catch (error) {
                console.error('인증 정보 복원 오류:', error);
                clearAuthData();
            } finally {
                setIsLoading(false);
            }
        };

        restoreAuthData();
    }, []);

    const clearAuthData = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
    };

    const validateToken = async (token) => {
        try {
            const response = await fetch('/api/users/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user) {
                    return { isValid: true, userData: data.user };
                }
            }
            return { isValid: false, userData: null };
        } catch (error) {
            console.error('토큰 검증 오류:', error);
            return { isValid: false, userData: null };
        }
    };

    const login = (userData, authToken) => {
        if (!authToken) {
            console.error('토큰이 없습니다!');
            return false;
        }
        setUser(userData);
        setToken(authToken);
        setIsLoggedIn(true);
        localStorage.setItem('token', authToken);
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('authUser', JSON.stringify(userData));
        return true;
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setIsLoggedIn(false);
        clearAuthData();
    };

    // ✨✨✨ 프로필 이미지 업데이트 함수 추가 ✨✨✨
    const updateUserProfileImage = (newImageUrl) => {
        // 현재 user 상태를 기반으로 업데이트된 객체 생성
        const updatedUser = { ...user, profileImage: newImageUrl };

        // 1. React 상태 업데이트
        setUser(updatedUser);
        
        // 2. localStorage 업데이트 (새로고침 시 유지되도록)
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
        
        console.log('AuthContext: 프로필 이미지가 업데이트되었습니다.', updatedUser);
    };

    if (isLoading) {
        return <div>인증 정보 로딩 중...</div>;
    }

    return (
        <AuthContext.Provider value={{
            isLoggedIn,
            user,
            token,
            login,
            logout,
            isLoading,
            updateUserProfileImage // ✨ Provider value에 추가
        }}>
            {children}
        </AuthContext.Provider>
    );
};