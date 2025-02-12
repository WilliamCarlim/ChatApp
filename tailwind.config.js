/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'whatsapp': {
                    DEFAULT: '#00a884',
                    dark: '#008f6f',
                }
            },
            keyframes: {
                'slide-up': {
                    '0%': { transform: 'translateY(100%)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' }
                }
            },
            animation: {
                'slide-up': 'slide-up 0.3s ease-out'
            }
        },
    },
    plugins: [],
} 