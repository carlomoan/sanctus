// web/src/components/StyleInjector.tsx
//
// Injects a persistent <style id="sanctus-theme"> tag into <head> on every
// settings load so that CSS variables survive React re-renders and page
// refreshes. This is the ONLY component that writes CSS variables.
//
// Usage: <StyleInjector /> — place once inside SettingsProvider, before Layout.

import { useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

// Generates a full 50–900 palette from a single hex color using HSL interpolation
function generatePalette(hex: string): Record<number, string> {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // Convert RGB to HSL
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
            case gn: h = ((bn - rn) / d + 2) / 6; break;
            case bn: h = ((rn - gn) / d + 4) / 6; break;
        }
    }

    const hDeg = Math.round(h * 360);
    const sPct = Math.round(s * 100);

    // Map shade numbers to lightness percentages
    const shades: Record<number, number> = {
        50: 97, 100: 94, 200: 86, 300: 74, 400: 62,
        500: 50, 600: 42, 700: 34, 800: 26, 900: 18,
    };

    const result: Record<number, string> = {};
    Object.entries(shades).forEach(([shade, lightness]) => {
        result[Number(shade)] = `hsl(${hDeg} ${sPct}% ${lightness}%)`;
    });
    return result;
}

function buildStyleSheet(s: Record<string, string>): string {
    const lines: string[] = [':root {'];

    // Primary palette
    if (s['ui.primary_color']) {
        try {
            const palette = generatePalette(s['ui.primary_color']);
            Object.entries(palette).forEach(([shade, hsl]) => {
                lines.push(`  --color-primary-${shade}: ${hsl};`);
            });
        } catch { /* ignore bad hex */ }
    }

    // Secondary palette
    if (s['ui.secondary_color']) {
        try {
            const palette = generatePalette(s['ui.secondary_color']);
            Object.entries(palette).forEach(([shade, hsl]) => {
                lines.push(`  --color-secondary-${shade}: ${hsl};`);
            });
        } catch { /* ignore bad hex */ }
    }

    // Direct hex vars
    const colorMap: [string, string][] = [
        ['ui.sidebar_bg', '--color-sidebar-bg'],
        ['ui.sidebar_text', '--color-sidebar-text'],
        ['ui.sidebar_active_bg', '--color-sidebar-active-bg'],
        ['ui.sidebar_border', '--color-sidebar-border'],
        ['ui.topbar_bg', '--color-topbar-bg'],
        ['ui.topbar_text', '--color-topbar-text'],
        ['ui.topbar_border', '--color-topbar-border'],
        ['ui.background_main', '--color-background-main'],
        ['ui.background_light', '--color-background-light'],
        ['ui.background_dark', '--color-background-dark'],
        ['ui.text_primary', '--color-text-primary'],
        ['ui.text_secondary', '--color-text-secondary'],
        ['ui.text_muted', '--color-text-muted'],
        ['ui.border_primary', '--color-border-primary'],
        ['ui.border_secondary', '--color-border-secondary'],
        ['ui.success_color', '--color-success'],
        ['ui.warning_color', '--color-warning'],
        ['ui.info_color', '--color-info'],
        ['ui.danger_color', '--color-danger'],
        ['ui.footer_bg', '--color-footer-bg'],
        ['ui.footer_text', '--color-footer-text'],
        ['ui.footer_border', '--color-footer-border'],
    ];

    colorMap.forEach(([key, cssVar]) => {
        if (s[key]) lines.push(`  ${cssVar}: ${s[key]};`);
    });

    lines.push('}');

    // Also apply to body background so flash is prevented
    if (s['ui.background_main']) {
        lines.push(`body { background-color: ${s['ui.background_main']}; }`);
    }
    if (s['ui.sidebar_bg']) {
        lines.push(`aside { background-color: ${s['ui.sidebar_bg']}; }`);
    }

    return lines.join('\n');
}

const STYLE_TAG_ID = 'sanctus-theme';

export const StyleInjector = () => {
    const { settings, loading } = useSettings();

    useEffect(() => {
        if (loading) return;

        // Build the complete CSS string
        const css = buildStyleSheet(settings);

        // Find existing tag or create new one
        let styleTag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = STYLE_TAG_ID;
            // Insert as FIRST style in <head> so Tailwind can override where needed
            // but CSS vars are available immediately
            document.head.insertBefore(styleTag, document.head.firstChild);
        }
        styleTag.textContent = css;

        // Also update document title from settings
        const appName = settings['ui.app_name'];
        if (appName && appName !== document.title) {
            // Only update if we're on the base title (don't override page-specific titles)
            if (document.title === 'Sanctus — Parish Management' || document.title === appName) {
                document.title = `${appName} — Parish Management`;
            }
        }
    }, [settings, loading]);

    // Renders nothing — purely a side-effect component
    return null;
};