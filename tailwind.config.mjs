/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,md,mdx,js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EBF2FF',
          500: '#3D85FF',
          700: '#0B5FFF',
          900: '#062E6F',
        },
        accent: {
          50:  '#E6F7F1',
          600: '#0E9F6E',
          700: '#067A52',
        },
        ink: {
          50:  '#F9FAFB',
          200: '#E5E7EB',
          500: '#6B7280',
          700: '#374151',
          900: '#111827',
          950: '#0B1220',
        },
        // ── Slide-deck palette (homepage + nav pages). Lime + near-black + white.
        canvas: {
          DEFAULT: '#FFFFFF',   // primary page bg
          alt:     '#F2F8E0',   // pale-lime section bg
          tint:    '#FAFCF2',   // very subtle tint
          deep:    '#0F1014',   // near-black surface
          surface: '#FFFFFF',
        },
        graphite: {
          900: '#0F1014',
          700: '#2D2F36',
          500: '#6B6E73',
          300: '#A3A6AB',
          200: '#E5E7EB',
          100: '#F3F4F2',
        },
        // Lime/chartreuse accent (Axios-inspired)
        lime: {
          DEFAULT: '#C8F031',
          hover:   '#B6DD22',
          soft:    '#E8F4B5',   // tint background
          bg:      '#F2F8E0',   // section background
        },
        // Legacy alias so any leftover `text-mute` etc. still resolves.
        mute: {
          DEFAULT: '#C8F031',
          hover:   '#B6DD22',
          soft:    '#F2F8E0',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', '-apple-system', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      maxWidth: {
        prose: '65ch',
      },
    },
  },
  plugins: [],
};
