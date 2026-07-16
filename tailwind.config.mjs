/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        base: '#0B0F1A',
        panel: '#0F1526',
        'panel-raised': '#141B30',
        border: 'rgba(232,236,245,0.08)',
        'border-strong': 'rgba(232,236,245,0.16)',
        ink: '#E8ECF5',
        muted: '#8993AD',
        teal: '#00C2A8',
        amber: '#F5A623',
        signal: '#FF5C6C',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.9)', opacity: '0' },
          '100%': { transform: 'scale(1.9)', opacity: '0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.2s cubic-bezier(0.2,0.6,0.4,1) infinite',
        blink: 'blink 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};