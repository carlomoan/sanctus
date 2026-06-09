/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // DashboardKit-inspired color scheme with CSS variable support for dynamic theming
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
        },
        secondary: {
          50: 'rgb(var(--color-secondary-50) / <alpha-value>)',
          100: 'rgb(var(--color-secondary-100) / <alpha-value>)',
          200: 'rgb(var(--color-secondary-200) / <alpha-value>)',
          300: 'rgb(var(--color-secondary-300) / <alpha-value>)',
          400: 'rgb(var(--color-secondary-400) / <alpha-value>)',
          500: 'rgb(var(--color-secondary-500) / <alpha-value>)',
          600: 'rgb(var(--color-secondary-600) / <alpha-value>)',
          700: 'rgb(var(--color-secondary-700) / <alpha-value>)',
          800: 'rgb(var(--color-secondary-800) / <alpha-value>)',
          900: 'rgb(var(--color-secondary-900) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-secondary-500) / <alpha-value>)',
        },
        success: 'rgb(var(--color-success) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
        // Sidebar colors
        sidebar: {
          bg: 'rgb(var(--color-sidebar-bg) / <alpha-value>)',
          text: 'rgb(var(--color-sidebar-text) / <alpha-value>)',
          active: 'rgb(var(--color-sidebar-active-bg) / <alpha-value>)',
          hover: 'rgb(var(--color-sidebar-hover) / <alpha-value>)',
          border: 'rgb(var(--color-sidebar-border) / <alpha-value>)',
        },
        // Topbar colors
        topbar: {
          bg: 'rgb(var(--color-topbar-bg) / <alpha-value>)',
          text: 'rgb(var(--color-topbar-text) / <alpha-value>)',
          border: 'rgb(var(--color-topbar-border) / <alpha-value>)',
        },
        // Footer colors
        footer: {
          bg: 'rgb(var(--color-footer-bg) / <alpha-value>)',
          text: 'rgb(var(--color-footer-text) / <alpha-value>)',
          border: 'rgb(var(--color-footer-border) / <alpha-value>)',
        },
        // Background colors
        background: {
          main: 'rgb(var(--color-background-main) / <alpha-value>)',
          light: 'rgb(var(--color-background-light) / <alpha-value>)',
          dark: 'rgb(var(--color-background-dark) / <alpha-value>)',
        },
        // Text colors
        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        // Border colors
        'border-primary': 'rgb(var(--color-border-primary) / <alpha-value>)',
        'border-secondary': 'rgb(var(--color-border-secondary) / <alpha-value>)',
        'sidebar-border': 'rgb(var(--color-sidebar-border) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 4px rgba(0,0,0,0.08)',
        'card-lg': '0 4px 16px rgba(0,0,0,0.12)',
        'sidebar': '2px 0 8px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        'card': '8px',
        'button': '6px',
      },
    },
  },
  plugins: [],
}
