/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			'2xl': 'calc(var(--radius) + 6px)',
  			'xl': 'calc(var(--radius) + 4px)',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			'glow': '0 0 20px rgba(96, 165, 250, 0.25)',
  			'glow-lg': '0 0 40px rgba(96, 165, 250, 0.3)',
  			'inner-glow': 'inset 0 0 20px rgba(96, 165, 250, 0.1)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0', opacity: '0' },
  				to: { height: 'var(--radix-accordion-content-height)', opacity: '1' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
  				to: { height: '0', opacity: '0' }
  			},
  			'fade-in': {
  				from: { opacity: '0' },
  				to: { opacity: '1' }
  			},
  			'fade-in-up': {
  				from: { opacity: '0', transform: 'translateY(16px)' },
  				to: { opacity: '1', transform: 'translateY(0)' }
  			},
  			'fade-in-down': {
  				from: { opacity: '0', transform: 'translateY(-16px)' },
  				to: { opacity: '1', transform: 'translateY(0)' }
  			},
  			'fade-in-scale': {
  				from: { opacity: '0', transform: 'scale(0.95)' },
  				to: { opacity: '1', transform: 'scale(1)' }
  			},
  			'slide-in-left': {
  				from: { opacity: '0', transform: 'translateX(-20px)' },
  				to: { opacity: '1', transform: 'translateX(0)' }
  			},
  			'slide-in-right': {
  				from: { opacity: '0', transform: 'translateX(20px)' },
  				to: { opacity: '1', transform: 'translateX(0)' }
  			},
  			'scale-in': {
  				from: { transform: 'scale(0.9)', opacity: '0' },
  				to: { transform: 'scale(1)', opacity: '1' }
  			},
  			'pulse-glow': {
  				'0%, 100%': { boxShadow: '0 0 0 0 rgba(96, 165, 250, 0.4)' },
  				'50%': { boxShadow: '0 0 20px 4px rgba(96, 165, 250, 0.2)' }
  			},
  			'shimmer': {
  				'0%': { backgroundPosition: '-200% 0' },
  				'100%': { backgroundPosition: '200% 0' }
  			},
  			'bounce-subtle': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-4px)' }
  			},
  			'float': {
  				'0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
  				'50%': { transform: 'translateY(-10px) rotate(2deg)' }
  			},
  			'gradient-shift': {
  				'0%': { backgroundPosition: '0% 50%' },
  				'50%': { backgroundPosition: '100% 50%' },
  				'100%': { backgroundPosition: '0% 50%' }
  			},
  			'border-glow': {
  				'0%, 100%': { borderColor: 'rgba(96, 165, 250, 0.3)' },
  				'50%': { borderColor: 'rgba(96, 165, 250, 0.6)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  			'accordion-up': 'accordion-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  			'fade-in': 'fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  			'fade-in-up': 'fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  			'fade-in-down': 'fade-in-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  			'fade-in-scale': 'fade-in-scale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  			'slide-in-left': 'slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  			'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  			'scale-in': 'scale-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
  			'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
  			'shimmer': 'shimmer 2s linear infinite',
  			'bounce-subtle': 'bounce-subtle 1.5s ease-in-out infinite',
  			'float': 'float 4s ease-in-out infinite',
  			'gradient-shift': 'gradient-shift 4s ease infinite',
  			'border-glow': 'border-glow 2s ease-in-out infinite'
  		},
  		transitionTimingFunction: {
  			'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
  			'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  			'spring': 'cubic-bezier(0.22, 0.68, 0, 1.15)'
  		},
  		transitionDuration: {
  			'fast': '150ms',
  			'normal': '250ms',
  			'slow': '400ms'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
