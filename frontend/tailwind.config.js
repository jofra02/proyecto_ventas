/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#2563eb',
                    hover: '#1d4ed8',
                },
                secondary: '#64748b',
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
                sidebar: {
                    DEFAULT: '#1e293b',
                    muted: '#94a3b8',
                    text: '#f8fafc'
                },
                body: '#f1f5f9',
                border: '#e2e8f0'
            },
            borderRadius: {
                md: '8px',
            }
        },
    },
    plugins: [],
}
