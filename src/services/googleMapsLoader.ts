/**
 * Official Google Maps Platform JavaScript API Loader
 * Handles dynamic script loading, singleton callback resolution, and error reporting.
 */

let loadPromise: Promise<typeof google.maps> | null = null;

export function isGoogleMapsLoaded(): boolean {
  return typeof window !== 'undefined' && !!window.google?.maps;
}

export function loadGoogleMapsScript(apiKey: string): Promise<typeof google.maps> {
  // If already loaded and functional, return immediately
  if (isGoogleMapsLoaded() && window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  // If already loading with the same key, return the existing promise
  if (loadPromise) {
    return loadPromise;
  }

  if (!apiKey || apiKey.trim().length < 8) {
    return Promise.reject(new Error('MISSING_API_KEY'));
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return Promise.reject(new Error('OFFLINE'));
  }

  loadPromise = new Promise((resolve, reject) => {
    // Unique callback name
    const callbackName = `__googleMapsInitCallback_${Date.now()}`;
    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps script loaded but google.maps namespace is missing.'));
      }
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey.trim())}&callback=${callbackName}&libraries=geometry`;
    script.async = true;
    script.defer = true;

    script.onerror = (e) => {
      delete (window as any)[callbackName];
      loadPromise = null;
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        reject(new Error('OFFLINE'));
      } else {
        reject(new Error('FAILED_TO_LOAD_SCRIPT'));
      }
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
