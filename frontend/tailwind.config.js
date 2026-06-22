import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1rem', screens: { '2xl': '1400px' } },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#047C00',
          hover: '#036000',
          light: '#06820B',
          deep: '#013E00',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#0F7702',
          hover: '#0B5C02',
          foreground: '#FFFFFF',
        },
        sidebar: {
          DEFAULT: '#047C00',
          foreground: '#FFFFFF',
          glass: 'rgba(4, 124, 0, 0.85)',
        },
        background: '#F4F7F4',
        surface: '#FFFFFF',
        'surface-alt': '#FAFBF9',
        foreground: '#0F172A',
        muted: { DEFAULT: '#EDF1ED', foreground: '#5B6B5C' },
        destructive: { DEFAULT: '#DC2626', foreground: '#FFFFFF' },
        success: '#22C55E',
        warning: '#F59E0B',
        info: '#3B82F6',
        soja: '#A8B948',
        trigo: '#E8B53D',
        maiz: '#F2A03C',
        girasol: '#F4D03F',
        sorgo: '#B8482A',
        border: '#E2E8E0',
        input: '#E2E8E0',
        ring: '#047C00',
      },
      fontFamily: {
        sans: ['Inter var', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: { xl: '0.875rem', lg: '0.5rem', md: '0.375rem', sm: '0.25rem' },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(4, 124, 0, 0.12)',
        lift: '0 10px 40px -10px rgba(15, 23, 42, 0.18)',
        glow: '0 0 0 4px rgba(4, 124, 0, 0.12)',
      },
      backdropBlur: { xs: '2px' },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
        'grow': 'grow 0.6s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        breathe: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' },
        },
        grow: {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
