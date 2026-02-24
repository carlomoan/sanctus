import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { SETTING_DEFINITIONS } from '../constants/settings';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  settings: Record<string, string>;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  getSetting: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Helper to generate color palette
function generatePalette(hex: string) {
  // Simple shade generator - in a real app, use a library like 'tinycolor2' or 'colord'
  // This is a basic implementation to avoid deps

  const hexToRgb = (hex: string) => {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_m, r, g, b) => {
      return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  // Mix with white for lighter shades, black for darker
  const mix = (color: { r: number, g: number, b: number }, mixColor: { r: number, g: number, b: number }, weight: number) => {
    return {
      r: Math.round(color.r * (1 - weight) + mixColor.r * weight),
      g: Math.round(color.g * (1 - weight) + mixColor.g * weight),
      b: Math.round(color.b * (1 - weight) + mixColor.b * weight)
    };
  };

  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  return {
    50: mix(rgb, white, 0.95),
    100: mix(rgb, white, 0.9),
    200: mix(rgb, white, 0.75),
    300: mix(rgb, white, 0.6),
    400: mix(rgb, white, 0.3),
    500: rgb, // Base
    600: mix(rgb, black, 0.1),
    700: mix(rgb, black, 0.3),
    800: mix(rgb, black, 0.5),
    900: mix(rgb, black, 0.7),
  };
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const refreshSettings = async () => {
    setLoading(true);
    try {
      const finalSettings: Record<string, string> = {};

      // 1. Load defaults
      SETTING_DEFINITIONS.forEach(d => { finalSettings[d.key] = d.value; });

      // 2. Load Global Settings
      try {
        const globalSettingsResponse = await api.listSettings();
        console.log('Global settings response:', globalSettingsResponse);
        if (Array.isArray(globalSettingsResponse)) {
          globalSettingsResponse.forEach((s: any) => {
            if (s.setting_value !== undefined && s.setting_value !== null) {
              finalSettings[s.setting_key] = s.setting_value;
            }
          });
        }
      } catch (e) {
        console.warn('Failed to load global settings (likely not logged in)', e);
      }

      // 3. Load Parish Settings (if user has parish_id)
      if (user?.parish_id) {
        try {
          console.log('Loading parish settings for:', user.parish_id);
          const parishSettingsResponse = await api.listSettings(user.parish_id);
          console.log('Parish settings response:', parishSettingsResponse);
          if (Array.isArray(parishSettingsResponse)) {
            parishSettingsResponse.forEach((s: any) => {
              if (s.setting_value !== undefined && s.setting_value !== null) {
                finalSettings[s.setting_key] = s.setting_value;
              }
            });
          }
        } catch (e) {
          console.error('Failed to load parish settings', e);
        }
      }

      console.log('Final merged settings:', finalSettings);
      setSettings(finalSettings);
      applyTheme(finalSettings);
    } catch (e) {
      console.error('Failed to refresh settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (currentSettings: Record<string, string>) => {
    const root = document.documentElement;
    const primaryColor = currentSettings['ui.primary_color'];

    // Apply Primary Color Palette
    if (primaryColor) {
      const palette = generatePalette(primaryColor);
      if (palette) {
        Object.entries(palette).forEach(([shade, rgb]) => {
          root.style.setProperty(`--color-primary-${shade}`, `${rgb.r} ${rgb.g} ${rgb.b}`);
        });
      }
    }

    // Apply other UI colors
    const colorSettings = [
      { key: 'ui.sidebar_bg', var: '--color-sidebar-bg' },
      { key: 'ui.sidebar_text', var: '--color-sidebar-text' },
      { key: 'ui.sidebar_active_bg', var: '--color-sidebar-active-bg' },
      { key: 'ui.topbar_bg', var: '--color-topbar-bg' },
      { key: 'ui.topbar_text', var: '--color-topbar-text' },
      { key: 'ui.footer_bg', var: '--color-footer-bg' },
      { key: 'ui.footer_text', var: '--color-footer-text' },
    ];

    colorSettings.forEach(({ key, var: variable }) => {
      const hex = currentSettings[key];
      if (hex) {
        // Simple hex check
        root.style.setProperty(variable, hex);
      }
    });
  };

  useEffect(() => {
    refreshSettings();
  }, [user?.id, user?.parish_id]);

  const getSetting = (key: string) => settings[key] ?? SETTING_DEFINITIONS.find(d => d.key === key)?.value ?? '';

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings, getSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
