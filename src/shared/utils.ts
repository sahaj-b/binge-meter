export function sitePatterns(site: string): string[] {
  return [`*://${site}/*`, `*://www.${site}/*`];
}
