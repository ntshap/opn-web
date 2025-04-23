"use client"

import { useEffect } from 'react'

export function RegisterServiceWorker() {
  useEffect(() => {
    // Temporarily disable service worker registration to troubleshoot chunk loading issues
    // We'll comment this out for now to see if it resolves the ChunkLoadError
    /*
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope)
          })
          .catch(error => {
            console.log('ServiceWorker registration failed: ', error)
          })
      })
    }
    */

    // If there's an existing service worker, unregister it
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
          registration.unregister();
          console.log('ServiceWorker unregistered to fix chunk loading issues');
        }
      });
    }
  }, [])

  return null
}
