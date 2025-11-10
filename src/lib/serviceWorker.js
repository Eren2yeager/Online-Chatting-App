/**
 * Service Worker Registration and Management
 */

/**
 * Check if service workers are supported
 */
export function isServiceWorkerSupported() {
  return 'serviceWorker' in navigator;
}

/**
 * Register service worker
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function registerServiceWorker() {
  if (!isServiceWorkerSupported()) {
    console.warn('Service workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('✅ Service worker registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('🔄 Service worker update found');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('✅ New service worker installed, ready to activate');
          // Optionally notify user about update
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('❌ Service worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister service worker
 * @returns {Promise<boolean>}
 */
export async function unregisterServiceWorker() {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const success = await registration.unregister();
      console.log('Service worker unregistered:', success);
      return success;
    }
    return false;
  } catch (error) {
    console.error('Error unregistering service worker:', error);
    return false;
  }
}

/**
 * Get service worker registration
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function getServiceWorkerRegistration() {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    return await navigator.serviceWorker.getRegistration();
  } catch (error) {
    console.error('Error getting service worker registration:', error);
    return null;
  }
}

/**
 * Check if service worker is active
 * @returns {Promise<boolean>}
 */
export async function isServiceWorkerActive() {
  const registration = await getServiceWorkerRegistration();
  return registration && registration.active !== null;
}

/**
 * Send message to service worker
 * @param {Object} message - Message to send
 */
export async function sendMessageToServiceWorker(message) {
  if (!isServiceWorkerSupported() || !navigator.serviceWorker.controller) {
    console.warn('No active service worker to send message to');
    return;
  }

  try {
    navigator.serviceWorker.controller.postMessage(message);
  } catch (error) {
    console.error('Error sending message to service worker:', error);
  }
}

/**
 * Update service worker
 */
export async function updateServiceWorker() {
  const registration = await getServiceWorkerRegistration();
  if (registration) {
    try {
      await registration.update();
      console.log('Service worker update check triggered');
    } catch (error) {
      console.error('Error updating service worker:', error);
    }
  }
}
