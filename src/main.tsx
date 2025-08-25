import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from "@/components/ThemeProvider"
import { OptimizedAuthProvider } from "@/hooks/useOptimizedAuth"

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OptimizedAuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
        storageKey="ziggy-theme"
      >
        <App />
      </ThemeProvider>
    </OptimizedAuthProvider>
  </React.StrictMode>
);
