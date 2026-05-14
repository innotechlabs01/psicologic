export function getSiteUrl(request?: Request): string {
  if (import.meta.env.PUBLIC_SITE_URL) {
    return import.meta.env.PUBLIC_SITE_URL.replace(/\/+$/, '');
  }
  if (import.meta.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${import.meta.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (import.meta.env.VERCEL_URL) {
    return `https://${import.meta.env.VERCEL_URL}`;
  }
  if (request) {
    return new URL(request.url).origin;
  }
  return 'http://localhost:4321';
}
