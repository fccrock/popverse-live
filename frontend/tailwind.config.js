/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#030509',
      },
      backgroundImage: {
        'radial-violet': 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.20) 0%, transparent 60%)',
      },
      boxShadow: {
        'glow-violet': '0 0 30px rgba(124,58,237,0.3)',
        'glow-violet-strong': '0 0 40px rgba(124,58,237,0.6)',
        'glow-rose':   '0 0 30px rgba(244,63,94,0.3)',
      },
      animation: {
        'fade-up':    'fade-up 0.5s ease both',
        'fade-in':    'fade-in 0.3s ease both',
        'scale-in':   'scale-in 0.25s ease both',
        'float':      'float 3s ease-in-out infinite',
        'shimmer':    'shimmer 1.8s infinite',
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        'scale-in': {
          from: { opacity: 0, transform: 'scale(0.95)' },
          to:   { opacity: 1, transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124,58,237,0.3)' },
          '50%':       { boxShadow: '0 0 40px rgba(124,58,237,0.6), 0 0 80px rgba(124,58,237,0.2)' },
        },
      },
    },
  },
  plugins: [],
};
