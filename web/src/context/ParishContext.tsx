import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface ParishContextType {
  activeParishId: string | null;
  isGlobalMode: boolean;
  setActiveParish: (parishId: string | null) => void;
  setGlobalMode: () => void;
  getEffectiveParishId: () => string | null;
}

const ParishContext = createContext<ParishContextType | undefined>(undefined);

export const ParishProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeParishId, setActiveParishId] = useState<string | null>(null);
  const [isGlobalMode, setIsGlobalMode] = useState(true);

  // Initialize with user's parish if not SUPER_ADMIN
  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN' && user?.parish_id) {
      setActiveParishId(user.parish_id);
      setIsGlobalMode(false);
    }
  }, [user]);

  const setActiveParish = (parishId: string | null) => {
    setActiveParishId(parishId);
    setIsGlobalMode(false);
  };

  const setGlobalMode = () => {
    setActiveParishId(null);
    setIsGlobalMode(true);
  };

  const getEffectiveParishId = () => {
    // For SUPER_ADMIN: return active parish if not in global mode
    // For other users: always return their parish
    if (user?.role === 'SUPER_ADMIN') {
      return isGlobalMode ? null : activeParishId;
    }
    return user?.parish_id || null;
  };

  return (
    <ParishContext.Provider value={{
      activeParishId,
      isGlobalMode,
      setActiveParish,
      setGlobalMode,
      getEffectiveParishId,
    }}>
      {children}
    </ParishContext.Provider>
  );
};

export const useParish = () => {
  const context = useContext(ParishContext);
  if (context === undefined) {
    throw new Error('useParish must be used within a ParishProvider');
  }
  return context;
};
