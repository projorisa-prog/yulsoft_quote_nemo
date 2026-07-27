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
          50: '#f0f0f5',
          100: '#e0e0eb',
          200: '#c7c7d8',
          300: '#a3a3bd',
          400: '#8585a1',
          500: '#6e6e88',
          600: '#5a5a6f',
          700: '#4a4a57',
          800: '#3d3d44',
          900: '#1a1a2e',
          950: '#0d0d17',
        },
        accent: {
          50: '#fdf6ec',
          100: '#fae9d3',
          200: '#f5d0a2',
          300: '#edb067',
          400: '#e38c36',
          500: '#c49a6c',
          600: '#a87d56',
          700: '#875f42',
          800: '#6d4d38',
          900: '#583f31',
        },
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
    },
  },
  plugins: [],
};

export default config;