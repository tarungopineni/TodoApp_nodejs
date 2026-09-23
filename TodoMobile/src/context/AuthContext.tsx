import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, removeToken, saveToken } from '../services/storage';
import { authApi } from '../services/api';
import { RegisterRequest, UserProfile } from '../types/api';

interface AuthContextData {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  reloadUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadUserProfile = async () => {
    try {
      const profile = await authApi.getUserProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await getToken();
        if (storedToken) {
          setTokenState(storedToken);
          await loadUserProfile();
        }
      } catch (error) {
        console.error('Error restoring auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authApi.login(username, password);
    await saveToken(response.access_token);
    try {
      const profile = await authApi.getUserProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to load user profile during login:', error);
    }
    setTokenState(response.access_token);
  };

  const register = async (payload: RegisterRequest) => {
    await authApi.register(payload);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await removeToken();
      setTokenState(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        login,
        register,
        logout,
        reloadUserProfile: loadUserProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
