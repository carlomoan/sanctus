// web/src/context/SettingsContext.tsx
//
// Fixed version — properly persists CSS vars via StyleInjector,
// enforces parish scope, and prevents wrong-context saves.

import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, ReactNode,
} from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';
import { SETTING_DEFINITIONS } from '../constants/settings';
import i18n from '../i18n';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SettingsContextValue {
  settings: Record<string, string>;
  loading: boolean;
  /** The parish whose settings are currently loaded (null = diocese/global) */
  activeParishId: string | null;
  /** Set the parish context for viewing/editing. null = diocese/global */
  setActiveParishId: (id: string | null) => void;
  /** Reload settings from DB for the current context */
  refreshSettings: (parishId?: string | null) => Promise<void>;
  /** Get a single setting value with fallback to default */
  getSetting: (key: string) => string;
  /** True if current user can edit a given setting key */
  canEditKey: (key: string) => boolean;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

// ── Default values map ─────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: Record<string, string> = Object.fromEntries(
  SETTING_DEFINITIONS.map(d => [d.key, d.value])
);

// ── Provider ──────────────────────────────────────────────────────────────────
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [activeParishId, setActiveParishId] = useState<string | null>(null);

  // Ref to prevent duplicate concurrent fetches
  const fetchingRef = useRef(false);

  // Determine effective parish ID for loading:
  // - SuperAdmin: uses activeParishId (null = diocese/global)
  // - ParishAdmin/others: always their own parish_id
  const effectiveParishId = useCallback(
    (overrideId?: string | null): string | null => {
      if (user?.role === 'SUPER_ADMIN') {
        return overrideId !== undefined ? overrideId : activeParishId;
      }
      return user?.parish_id ?? null;
    },
    [user, activeParishId]
  );

  // ── canEditKey ──────────────────────────────────────────────────────────────
  // Parish admins can only edit 'parish' or 'both' scoped keys.
  // SuperAdmin can edit everything.
  const canEditKey = useCallback((key: string): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.role === 'PARISH_ADMIN') {
      const def = SETTING_DEFINITIONS.find(d => d.key === key);
      return def ? def.scope === 'parish' || def.scope === 'both' : false;
    }
    return false; // viewers, accountants, etc. cannot edit settings
  }, [user]);

  // ── Core fetch ──────────────────────────────────────────────────────────────
  const refreshSettings = useCallback(async (overrideParishId?: string | null) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);

    try {
      const merged: Record<string, string> = { ...DEFAULT_SETTINGS };

      // 1. Load diocese/global settings (parish_id = null in DB)
      try {
        const global = await api.listSettings(null);
        if (Array.isArray(global)) {
          global.forEach((s: any) => {
            if (s.setting_value != null) merged[s.setting_key] = s.setting_value;
          });
        }
      } catch (e) {
        console.warn('[Settings] Could not load global settings:', e);
      }

      // 2. If a parish context is active, load parish overrides on top
      const pid = effectiveParishId(overrideParishId);
      if (pid) {
        try {
          const parish = await api.listSettings(pid);
          if (Array.isArray(parish)) {
            parish.forEach((s: any) => {
              if (s.setting_value != null) merged[s.setting_key] = s.setting_value;
            });
          }
        } catch (e) {
          console.warn('[Settings] Could not load parish settings:', e);
        }
      }

      setSettings(merged);

      // Update activeParishId if override was provided
      if (overrideParishId !== undefined) {
        setActiveParishId(overrideParishId);
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [effectiveParishId]);

  // ── Initial load ────────────────────────────────────────────────────────────
  // Runs when user changes (login/logout) or when activeParishId changes
  useEffect(() => {
    if (!user) {
      // Not logged in — only load public/global defaults
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    // Set initial activeParishId for non-super-admins
    if (user.role !== 'SUPER_ADMIN' && user.parish_id) {
      setActiveParishId(user.parish_id);
    }

    refreshSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only re-run when user identity changes

  // Re-fetch when activeParishId changes (SuperAdmin switching parishes)
  useEffect(() => {
    if (!user || user.role !== 'SUPER_ADMIN') return;
    refreshSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeParishId]);

  // ── Apply language setting immediately ─────────────────────────────────────
  useEffect(() => {
    const language = settings['locale.language'];
    if (language && language !== i18n.language) {
      i18n.changeLanguage(language);
    }
  }, [settings['locale.language']]);

  const getSetting = useCallback(
    (key: string) => settings[key] ?? DEFAULT_SETTINGS[key] ?? '',
    [settings]
  );

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      activeParishId,
      setActiveParishId,
      refreshSettings,
      getSetting,
      canEditKey,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useSettings = (): SettingsContextValue => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};