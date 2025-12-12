/**
 * Ziggy Online Debate Platform
 * © 2011-2025 Justus Aryani. All Rights Reserved.
 * Proprietary and Confidential.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import React from 'react'
import { createRoot } from 'react-dom/client'

// Ownership signature - visible in browser console
console.log(
  '%c⚡ Ziggy Online Debate\n%c© 2011-2025 Justus Aryani\nAll Rights Reserved.\nUnauthorized reproduction prohibited.',
  'color: #e50914; font-size: 16px; font-weight: bold;',
  'color: #888; font-size: 11px;'
);
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
