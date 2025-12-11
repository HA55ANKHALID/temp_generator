import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Backgrounds (Dark Theme)
        'midnight-blue': '#1a1a2e', // Main app background, Header bar, Chat input bar, Login/Signup left panel
        'dark-slate': '#2a2a3b', // Sidebar, Chatbot Message bubbles (Assistant), Modals/Popups, Cards
        
        // Primary Accent (Action Color)
        'crimson': '#e94560', // Primary buttons, User Message bubbles, Links
        'crimson-dark': '#d62848', // Hover states of primary buttons
        
        // Neutrals & UI Elements
        'dark-gray': '#333333', // Input text fields, Sidebar item hover states
        'medium-gray': '#444444', // Active Sidebar item background, Bot message loading pulses
        
        // Light Mode Elements
        'charcoal': '#302b2c', // Input labels and text within white forms
      },
    },
  },
  plugins: [],
}
export default config

