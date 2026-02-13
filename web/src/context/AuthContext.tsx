import { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import { User, LoginRequest } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = api.getUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setIsLoading(false);

    api.setOnUnauthorized(() => {
      setUser(null);
    });
  }, []);

  const login = async (data: LoginRequest) => {
    const response = await api.login(data);
    setUser(response.user);
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
