import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserPrincipal, AppRole } from '../types/kaizen';
import { apiClient, isMockMode, mockClientInstance } from '../services/api';

interface AuthContextType {
  user: UserPrincipal | null;
  role: AppRole;
  isReviewer: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  isMock: boolean;
  login: () => void;
  logout: () => void;
  setMockRole: (role: AppRole) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserPrincipal | null>(null);
  const [role, setRole] = useState<AppRole>('public');
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isMockMode) {
        const mockRole = mockClientInstance.getActiveRole();
        setRole(mockRole);
        const currentUser = await mockClientInstance.getCurrentUser();
        setUser(currentUser);
      } else {
        const currentUser = await apiClient.getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          if (currentUser.userRoles.includes('admin')) {
            setRole('admin');
          } else if (currentUser.userRoles.includes('reviewer')) {
            setRole('reviewer');
          } else {
            setRole('public');
          }
        } else {
          setRole('public');
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải thông tin xác thực:', err);
      setUser(null);
      setRole('public');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const setMockRole = (newRole: AppRole) => {
    if (!isMockMode) return;
    mockClientInstance.setActiveRole(newRole);
    setRole(newRole);
    refreshUser();
  };

  const login = () => {
    if (isMockMode) {
      setMockRole('reviewer');
      return;
    }
    const currentPath = window.location.pathname || '/review';
    window.location.href = `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(currentPath)}`;
  };

  const logout = () => {
    if (isMockMode) {
      setMockRole('public');
      return;
    }
    window.location.href = `/.auth/logout?post_logout_redirect_uri=/`;
  };

  const isReviewer = role === 'reviewer' || role === 'admin';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isReviewer,
        isAdmin,
        isLoading,
        isMock: isMockMode,
        login,
        logout,
        setMockRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
