import { Capacitor } from '@capacitor/core';

const SERVER_URL_STORAGE_KEY = 'itihas_server_url';

export function isNativeMobileApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function normalizeServerUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `http://${trimmed}`;
}

export function getConfiguredServerUrl(): string {
  try {
    return normalizeServerUrl(localStorage.getItem(SERVER_URL_STORAGE_KEY));
  } catch {
    return '';
  }
}

export function setConfiguredServerUrl(url?: string | null): void {
  try {
    const clean = normalizeServerUrl(url);
    if (clean) {
      localStorage.setItem(SERVER_URL_STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(SERVER_URL_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Returns the backend base URL for API requests and Socket.IO.
 * - On normal web/browser serving from server.js: returns '' (same origin) unless overridden in native APK.
 * - On Vite dev port 5173: returns http://<host>:3000.
 * - On Capacitor Android APK: returns the configured Server URL (Render / Cloudflare / PC Wi-Fi).
 */
export function getEffectiveServerBaseUrl(overrideUrl?: string): string {
  const explicit = normalizeServerUrl(overrideUrl);
  if (explicit) return explicit;

  const configured = getConfiguredServerUrl();
  if (isNativeMobileApp()) {
    return configured;
  }

  if (typeof window !== 'undefined') {
    if (window.location.port === '5173') {
      return `${window.location.protocol}//${window.location.hostname}:3000`;
    }
    if (configured && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.protocol === 'capacitor:') {
      return configured;
    }
  }

  return '';
}

export function getRealtimeSocketUrl(overrideUrl?: string): string {
  const base = getEffectiveServerBaseUrl(overrideUrl);
  if (base) return base;
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}

export function apiUrl(path: string, overrideUrl?: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getEffectiveServerBaseUrl(overrideUrl);
  return base ? `${base}${cleanPath}` : cleanPath;
}
