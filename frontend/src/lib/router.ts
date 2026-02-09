/**
 * Minimal hash-based router for Svelte 5.
 * Uses #/ prefix for routes. No dependencies needed.
 */

import { writable } from 'svelte/store';

export const currentPath = writable(getPath());
export const params = writable<Record<string, string>>({});

function getPath(): string {
  const hash = window.location.hash.slice(1) || '/';
  return hash;
}

export function navigate(path: string) {
  window.location.hash = path;
}

// Listen for hash changes
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    currentPath.set(getPath());
  });
}

/**
 * Match a route pattern against the current path.
 * Supports :param placeholders.
 */
export function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  if (patternParts.length !== pathParts.length) return null;

  const matched: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      matched[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return matched;
}
