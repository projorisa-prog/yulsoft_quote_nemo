import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        accent: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        sidebar: '#f0f4ff',
        modern: {
          primary: '#1d1d1f',
          secondary: '#86868b',
          accent: '#0071e3',
          bg: '#f5f5f7',
        },
        color: {
          primary: '#2e4057',
          secondary: '#6c757d',
          accent: '#e85d75',
          bg: '#f8f9fa',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Noto Serif KR', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'card': '0 2px 12px 0 rgba(59,130,246,0.08)',
        'card-hover': '0 4px 24px 0 rgba(59,130,246,0.14)',
      },
      borderRadius: {
        'xl2': '1rem',
      },
    },
  },
  plugins: [],
};

export default config;