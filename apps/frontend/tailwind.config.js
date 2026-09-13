export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        shell: 'var(--bg-shell)',
        'shell-raised': 'var(--bg-shell-raised)',
        'shell-text': 'var(--shell-text)',
        'shell-text-muted': 'var(--shell-text-muted)',

        canvas: 'var(--bg-canvas)',
        app: 'var(--bg-canvas)',
        surface: 'var(--bg-surface)',
        'surface-raised': 'var(--bg-surface-raised)',
        'surface-elevated': 'var(--bg-surface-elevated)',
        'surface-hover': 'var(--bg-surface-hover)',
        column: 'var(--bg-column)',

        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',

        'border-default': 'var(--border-default)',
        'border-strong': 'var(--border-strong)',

        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-foreground': 'var(--accent-foreground)',
        'accent-soft': 'var(--accent-soft)',

        trail: 'var(--trail)',
        'trail-hover': 'var(--trail-hover)',
        'trail-foreground': 'var(--trail-foreground)',

        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--error)',
        info: 'var(--info)',
        selected: 'var(--selected-bg)',
        'disabled-bg': 'var(--disabled-bg)',
        'disabled-text': 'var(--disabled-text)',
        label: {
          clay: 'var(--label-clay)',
          moss: 'var(--label-moss)',
          ochre: 'var(--label-ochre)',
          slate: 'var(--label-slate)',
          plum: 'var(--label-plum)',
          stone: 'var(--label-stone)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Fraunces', 'Georgia', '"Times New Roman"', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-xl': [
          '2.5rem',
          { lineHeight: '1.08', letterSpacing: '-0.015em', fontWeight: '600' },
        ],
        'display-lg': [
          '1.875rem',
          { lineHeight: '1.15', letterSpacing: '-0.01em', fontWeight: '600' },
        ],
        display: ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-sm': ['1.1875rem', { lineHeight: '1.25', fontWeight: '600' }],

        'page-title': ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
        'board-title': ['1.125rem', { lineHeight: '1.3', fontWeight: '600' }],
        'column-header': [
          '0.75rem',
          { lineHeight: '1.3', fontWeight: '700', letterSpacing: '0.045em' },
        ],
        'task-title': ['0.9375rem', { lineHeight: '1.4', fontWeight: '600' }],
        body: ['0.875rem', { lineHeight: '1.45', fontWeight: '400' }],
        'body-medium': ['0.875rem', { lineHeight: '1.45', fontWeight: '500' }],
        meta: ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
        data: ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
        micro: ['0.6875rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '0.04em' }],
      },
      spacing: {
        13: '52px',
        15: '60px',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        dragged: 'var(--shadow-dragged)',
        none: 'none',
      },
      ringColor: {
        focus: 'var(--focus-ring)',
      },
      transitionDuration: {
        micro: '120ms',
        panel: '180ms',
        settle: '220ms',
      },
      transitionTimingFunction: {
        settle: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
