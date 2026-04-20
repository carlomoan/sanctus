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
      // Check if JWT token is still valid
      const token = api.getToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp * 1000 < Date.now()) {
            // Token expired, clear session
            logout();
            setIsLoading(false);
            return;
          }
        } catch (error) {
          // Invalid token, clear session
          logout();
          setIsLoading(false);
          return;
        }
      }
      setUser(savedUser);
    }
    setIsLoading(false);

    api.setOnUnauthorized(() => {
      setUser(null);
    });

    // Set up idle timeout (30 minutes)
    const IDLE_TIMEOUT = 30 * 60 * 1000;
    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout();
      }, IDLE_TIMEOUT);
    };

    // Reset on any user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer(); // start timer

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
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
