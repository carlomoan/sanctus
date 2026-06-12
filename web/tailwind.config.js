export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
          400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
          800: '#3730a3', 900: '#312e81',
        },
        secondary: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
          400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
          800: '#1e293b', 900: '#0f172a',
        },
        success: '#10b981',
        danger:  '#ef4444',
        warning: '#f59e0b',
        info:    '#3b82f6',
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card:    '0 1px 3px 0 rgb(0 0 0/0.05), 0 1px 2px -1px rgb(0 0 0/0.05)',
        'card-md':'0 4px 6px -1px rgb(0 0 0/0.06), 0 2px 4px -2px rgb(0 0 0/0.06)',
        'card-lg':'0 10px 15px -3px rgb(0 0 0/0.08), 0 4px 6px -4px rgb(0 0 0/0.05)',
        sidebar: '4px 0 24px 0 rgb(0 0 0/0.12)',
      },
      backgroundImage: {
        'background-light': 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        shimmer:    'shimmer 1.6s infinite linear',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },
    },
  },
  plugins: [],
}