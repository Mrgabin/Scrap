import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './lib/LanguageContext';
import './index.css';

// Global fetch interceptor to support external static hosting (Vercel, Firebase, etc.)
const originalFetch = window.fetch;
try {
  Object.defineProperty(window, 'fetch', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function (input: any, init: any) {
      if (typeof input === 'string' && input.startsWith('/api/')) {
        const apiBase = (import.meta as any).env?.VITE_API_URL || '';
        if (apiBase) {
          try {
            const currentHost = window.location.hostname;
            const apiHost = new URL(apiBase).hostname;
            // If we are on an external static hosting domain, route /api calls to the Cloud Run backend!
            if (currentHost !== apiHost && currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
              input = `${apiBase}${input}`;
            }
          } catch (e) {
            // ignore invalid URL
          }
        }
      }
      return originalFetch(input, init);
    }
  });
} catch (err) {
  console.warn("Could not override window.fetch via Object.defineProperty:", err);
  try {
    (window as any).fetch = function (input: any, init: any) {
      if (typeof input === 'string' && input.startsWith('/api/')) {
        const apiBase = (import.meta as any).env?.VITE_API_URL || '';
        if (apiBase) {
          try {
            const currentHost = window.location.hostname;
            const apiHost = new URL(apiBase).hostname;
            if (currentHost !== apiHost && currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
              input = `${apiBase}${input}`;
            }
          } catch (e) {
            // ignore
          }
        }
      }
      return originalFetch(input, init);
    };
  } catch (e2) {
    console.warn("Could not redefine window.fetch property:", e2);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
