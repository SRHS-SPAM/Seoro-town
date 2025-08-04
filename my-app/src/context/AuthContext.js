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
                console.log('저장된 토큰:', savedToken);
                console.log('저장된 사용자:', savedUser);
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
                            
                            // 통일된 형태로 다시 저장
                            localStorage.setItem('token', savedToken);
                            localStorage.setItem('authToken', savedToken);
                            localStorage.setItem('authUser', JSON.stringify(userData));
                            
                            console.log('인증 정보 복원됨:', { token: savedToken, user: userData });
                        }
                    } else {
                        // 토큰이 유효하지 않으면 모든 인증 데이터 제거
                        console.log('유효하지 않은 토큰, 모든 인증 데이터를 제거합니다.');
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
            const response = await fetch('http://localhost:3001/api/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success === true || data.user || response.status === 200) {
                    return {
                        isValid: true,
                        userData: data.user || data.data || null
                    };
                }
            }
            
            return { isValid: false, userData: null };
        } catch (error) {
            console.error('토큰 검증 오류:', error);
            return { isValid: false, userData: null };
        }
    };

    const login = (userData, authToken) => {
        console.log('로그인 시도:', { userData, authToken });
    
        if (!authToken) {
            console.error('토큰이 없습니다!');
            return false;
        }

        setUser(userData);
        setToken(authToken);
        setIsLoggedIn(true);
       
        // 기존 방식과 호환되도록 두 키 모두에 저장
        localStorage.setItem('token', authToken);
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('authUser', JSON.stringify(userData));
       
        console.log('로그인 성공, 토큰 저장:', authToken);
        return true;
    };

    const logout = () => {
        console.log('로그아웃 시작');
        
        setUser(null);
        setToken(null);
        setIsLoggedIn(false);
       
        clearAuthData();
       
        console.log('로그아웃 완료');
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
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
};