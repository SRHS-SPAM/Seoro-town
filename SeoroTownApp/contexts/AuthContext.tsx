import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../lib/api';

const TOKEN_KEY = 'seorotown_token';

interface User {
  _id: string;
  username: string;
  email: string;
  profileImage?: string | null;
  role?: 'user' | 'admin';
}

interface LoginRequest {
  identifier: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  token: string;
  user: User;
}

interface MeResponse {
  success: boolean;
  message?: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isInitializing: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistToken(token: string | null) {
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const handleAuthError = useCallback(async () => {
    await persistToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const fetchCurrentUser = useCallback(
    async (activeToken: string | null) => {
      if (!activeToken) {
        setUser(null);
        return;
      }
      try {
        const { data } = await apiFetch<MeResponse>('/api/users/me', {
          token: activeToken,
        });
        if (data.success && data.user) {
          setUser(data.user);
          setToken(activeToken);
        } else {
          throw new Error(data.message ?? '사용자 정보를 불러오지 못했습니다.');
        }
      } catch (error) {
        console.error('사용자 정보 로딩 실패:', error);
        await handleAuthError();
      }
    },
    [handleAuthError]
  );

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (storedToken) {
          await fetchCurrentUser(storedToken);
        }
      } finally {
        setIsInitializing(false);
      }
    })();
  }, [fetchCurrentUser]);

  const login = useCallback(
    async ({ identifier, password }: LoginRequest) => {
      try {
        const { data } = await apiFetch<LoginResponse>('/api/auth/login', {
          method: 'POST',
          body: { identifier, password },
        });

        if (!data.success || !data.token || !data.user) {
          throw new Error(data.message ?? '로그인에 실패했습니다.');
        }

        await persistToken(data.token);
        setToken(data.token);
        setUser(data.user);
      } catch (error) {
        const apiMessage =
          (error as any)?.data?.message ?? (error as Error).message;
        await handleAuthError();
        throw new Error(apiMessage ?? '로그인에 실패했습니다.');
      }
    },
    [handleAuthError]
  );

  const logout = useCallback(async () => {
    await handleAuthError();
  }, [handleAuthError]);

  const refreshCurrentUser = useCallback(async () => {
    await fetchCurrentUser(token);
  }, [fetchCurrentUser, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isInitializing,
      login,
      logout,
      refreshCurrentUser,
    }),
    [user, token, isInitializing, login, logout, refreshCurrentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  return ctx;
}

