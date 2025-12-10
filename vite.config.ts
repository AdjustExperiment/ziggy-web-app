import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Core vendor - loads immediately
            vendor: ['react', 'react-dom', 'react-router-dom'],
            // Core UI components - used on every page
            'ui-core': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-toast',
              '@radix-ui/react-tooltip',
            ],
            // Form UI - lazy loaded when forms are used
            'ui-forms': [
              '@radix-ui/react-checkbox',
              '@radix-ui/react-label',
              '@radix-ui/react-radio-group',
              '@radix-ui/react-switch',
              '@radix-ui/react-select',
            ],
            // Navigation UI - navbar dropdowns
            'ui-nav': [
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-popover',
              '@radix-ui/react-tabs',
              '@radix-ui/react-accordion',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-separator',
              '@radix-ui/react-avatar',
              '@radix-ui/react-alert-dialog',
            ],
            // Command menu - only loads when search opens
            cmdk: ['cmdk'],
            supabase: ['@supabase/supabase-js'],
            query: ['@tanstack/react-query', '@tanstack/react-virtual'],
            charts: ['recharts'],
            utils: ['date-fns', 'date-fns-tz', 'clsx', 'class-variance-authority', 'tailwind-merge', 'dompurify', 'zod'],
            // Heavy components in separate chunks - lazy loaded
            globe: ['cobe'],
            i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
            editor: ['react-quill'],
          },
        },
      },
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: mode === 'development',
  },
  esbuild: {
    target: 'esnext',
    minifyIdentifiers: mode === 'production',
    minifySyntax: true,
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
