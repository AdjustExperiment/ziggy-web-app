import React from 'react'
import { createRoot } from 'react-dom/client'
import './i18n' // Initialize i18n before app
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from "@/components/ThemeProvider"
import { OptimizedAuthProvider } from "@/hooks/useOptimizedAuth"
import { QueryProvider } from "@/providers/QueryProvider"

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <OptimizedAuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          storageKey="ziggy-theme"
        >
          <App />
        </ThemeProvider>
      </OptimizedAuthProvider>
    </QueryProvider>
  </React.StrictMode>
);
