/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Override borderRadius entirely so lg/xl match the design system spec
    // (prototype: lg = 0.25rem, xl = 0.5rem — sharper than Tailwind defaults)
    borderRadius: {
      'none': '0px',
      'sm':   '0.125rem',
      DEFAULT: '0.125rem',
      'md':   '0.25rem',
      'lg':   '0.25rem',   // design system: sharp corners
      'xl':   '0.5rem',    // design system: max allowed radius
      'full': '9999px',
    },
    extend: {
      colors: {
        // ── Full design-system palette (matches prototype token names exactly) ──
        'background':               '#0b1326',
        'surface':                  '#0b1326',   // page / body background
        'surface-dim':              '#0b1326',
        'surface-bright':           '#31394d',

        // Surface tiers
        'surface-container-lowest': '#060e20',
        'surface-container-low':    '#131b2e',
        'surface-container':        '#171f33',   // nav, standard panels
        'surface-container-high':   '#222a3d',
        'surface-container-highest':'#2d3449',   // hover / active states

        // On-surface
        'on-surface':               '#dae2fd',
        'on-surface-variant':       '#c6c6c6',
        'on-background':            '#dae2fd',

        // Primary / action
        'primary':                  '#ffffff',
        'on-primary':               '#001e2c',   // dark navy text on white CTAs

        // Accents
        'secondary':                '#b9c8de',   // slate-blue metadata
        'tertiary':                 '#d8e3fb',   // hover tint on white card

        // Secondary container (used in level badge)
        'secondary-container':      '#39485a',
        'on-secondary-container':   '#d4e4fa',

        // Error / destructive states
        'error':                    '#ffb4ab',
        'on-error':                 '#690005',
        'error-container':          '#93000a',
        'on-error-container':       '#ffdad6',

        // Borders
        'outline-variant':          '#474747',   // ghost borders @ 20% opacity
        'outline':                  '#919191',

        // ── Short aliases (used in scaffold placeholder screens) ──
        'surface-lowest':           '#060e20',
        'surface-low':              '#131b2e',
        'surface-panel':            '#171f33',
        'surface-high':             '#222a3d',
        'surface-highest':          '#2d3449',
      },

      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },

      boxShadow: {
        modal: '0 20px 40px rgba(6, 14, 32, 0.6)',
      },
    },
  },
  plugins: [],
}
