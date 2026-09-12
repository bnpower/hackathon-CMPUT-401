// Integration contract only: demo workspace operations intentionally stay local.
const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
function csrfToken() {
  return document.cookie.split('; ').find(cookie => cookie.startsWith('csrftoken='))?.split('=').slice(1).join('=') ?? '';
}
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'ApiError'; }
}
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const token = csrfToken();
  if (token && !['GET', 'HEAD', 'OPTIONS'].includes((options.method ?? 'GET').toUpperCase())) headers.set('X-CSRFToken', decodeURIComponent(token));
  const response = await fetch(`${baseUrl}/api${path}`, { ...options, headers, credentials: 'include' });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.detail ?? `Request failed (${response.status}). Please try again.`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export function ssoUrl(provider: 'google' | 'linkedin'): string | null {
  const value = provider === 'google' ? import.meta.env.VITE_GOOGLE_SSO_URL : import.meta.env.VITE_LINKEDIN_SSO_URL;
  if (!value) return null;
  const url = new URL(value, window.location.origin);
  if (url.protocol !== 'https:' && url.origin !== window.location.origin) return null;
  return url.href;
}
