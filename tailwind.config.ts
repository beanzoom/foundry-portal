
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-down": {
          "0%": {
            opacity: "0",
            transform: "translateY(-10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out",
        "fade-down": "fade-down 0.5s ease-out",
      },
      spacing: {
        // Consistent spacing scale
        'form': '1.5rem',
        'section': '2rem',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'hsl(var(--foreground))',
            a: {
              color: 'hsl(var(--primary))',
              textDecoration: 'underline',
              '&:hover': {
                color: 'hsl(var(--primary) / 0.8)',
              },
            },
            h1: {
              color: 'hsl(var(--foreground))',
              fontWeight: '700',
            },
            h2: {
              color: 'hsl(var(--foreground))',
              fontWeight: '600',
            },
            h3: {
              color: 'hsl(var(--foreground))',
              fontWeight: '600',
            },
            code: {
              color: 'hsl(var(--foreground))',
              backgroundColor: 'hsl(var(--muted))',
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            pre: {
              backgroundColor: 'hsl(var(--muted))',
              borderRadius: '0.375rem',
              padding: '0.75rem 1rem',
              code: {
                backgroundColor: 'transparent',
                padding: '0',
              },
            },
            table: {
              width: '100%',
              borderCollapse: 'collapse',
              thead: {
                borderBottomColor: 'hsl(var(--border))',
                borderBottomWidth: '2px',
              },
              th: {
                color: 'hsl(var(--foreground))',
                fontWeight: '600',
                padding: '0.75rem 1rem',
                textAlign: 'left',
              },
              td: {
                padding: '0.75rem 1rem',
                borderBottomColor: 'hsl(var(--border))',
                borderBottomWidth: '1px',
              },
            },
            '.task-list-item': {
              listStyleType: 'none',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              '&::before': {
                content: 'none',
              },
            },
            '.task-checkbox': {
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '1rem',
              height: '1rem',
              borderRadius: '0.25rem',
              border: '1px solid hsl(var(--border))',
            },
            // Enhanced status indicators
            '.status-complete': {
              color: 'rgb(22, 163, 74)', // green-600
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            },
            '.status-in-progress': {
              color: 'rgb(245, 158, 11)', // amber-500
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            },
            '.status-pending': {
              color: 'rgb(239, 68, 68)', // red-500
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            },
            // Executive summary styling
            '.executive-summary': {
              backgroundColor: 'hsl(var(--muted) / 0.3)',
              padding: '1rem',
              borderRadius: '0.375rem',
              borderLeft: '4px solid hsl(var(--primary))',
              margin: '1rem 0',
            },
            // Action items styling 
            '.action-item': {
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            },
            '.action-item-checkbox': {
              width: '1rem',
              height: '1rem',
              borderRadius: '0.25rem',
              marginTop: '0.125rem',
            },
            '.action-item-complete': {
              backgroundColor: 'rgb(220, 252, 231)', // green-100
              color: 'rgb(22, 163, 74)', // green-600
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
            '.action-item-pending': {
              border: '1px solid hsl(var(--muted-foreground) / 0.3)',
            },
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

