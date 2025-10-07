import forms from '@tailwindcss/forms'

/**
 * Configuración Tailwind v4.1.
 * Aseguramos `content` para que Tailwind escanee los archivos y genere las utilidades usadas.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563eb',
          600: '#2563eb',
          650: '#1f54e0',
          700: '#1d4ed8',
        },
        success: {
          DEFAULT: '#16a34a',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          DEFAULT: '#d97706',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          DEFAULT: '#dc2626',
          600: '#dc2626',
          700: '#b91c1c',
        },
        info: {
          DEFAULT: '#0ea5e9',
          600: '#06b6d4',
          700: '#0891b2',
        },
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        elevation1: '0 1px 2px 0 rgb(15 23 42 / 0.08)',
        elevation2: '0 4px 12px -4px rgb(15 23 42 / 0.12)',
        elevation3: '0 20px 35px -15px rgb(15 23 42 / 0.18)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
      },
      maxWidth: {
        page: '80rem',
      },
    },
  },
  plugins: [forms],
}
