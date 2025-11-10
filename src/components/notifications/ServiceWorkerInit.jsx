'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/serviceWorker';

/**
 * Service Worker Initialization Component
 * Registers service worker on mount
 */
export default function ServiceWorkerInit() {
  useEffect(() => {
    // Register service worker after page load
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        registerServiceWorker().catch(error => {
          console.error('Failed to register service worker:', error);
        });
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
