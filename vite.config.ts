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
          // Split vendor chunks
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-avatar', '@radix-ui/react-button', '@radix-ui/react-card', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-form', '@radix-ui/react-input', '@radix-ui/react-label', '@radix-ui/react-popover', '@radix-ui/react-select', '@radix-ui/react-separator', '@radix-ui/react-sheet', '@radix-ui/react-switch', '@radix-ui/react-table', '@radix-ui/react-tabs', '@radix-ui/react-textarea', '@radix-ui/react-toast', '@radix-ui/react-tooltip'],
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query'],
          charts: ['recharts'],
          utils: ['date-fns', 'date-fns-tz', 'clsx', 'class-variance-authority', 'tailwind-merge', 'dompurify', 'zod'],
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
