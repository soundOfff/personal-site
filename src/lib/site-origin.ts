export const SITE_ORIGIN = 'https://tomasbrasca.xyz';

export function siteUrl(path = '/'): string {
  return new URL(path, SITE_ORIGIN).href;
}

export function pageUrl(path = '/'): string {
  const url = new URL(path, SITE_ORIGIN);
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
  return url.href;
}
