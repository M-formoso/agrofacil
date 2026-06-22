import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        // Paleta AgroFácil — John Deere Green
        primary: {
          DEFAULT: '#047C00',
          hover: '#036000',
          light: '#06820B',
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
        },
        background: '#F8FAFC',
        surface: '#FFFFFF',
        foreground: '#0F172A',
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#64748B',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        info: '#3B82F6',
        border: '#E2E8F0',
        input: '#E2E8F0',
        ring: '#047C00',
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
