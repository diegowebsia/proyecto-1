/**
 * Google Maps — enlaces reales de «déjanos una reseña» por empresa.
 *
 * v3.14.0: el cliente pega el ENLACE de su ficha (lo que ve en el navegador
 * o en «Compartir») y el backend extrae el identificador solo. El Place ID
 * «crudo» sigue siendo aceptado para quien ya lo conozca.
 */

/** Enlace directo a escribir reseña (requiere Place ID). */
export function googleReviewLink(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

/**
 * Extrae el identificador de lugar de cualquier entrada razonable:
 *   · https://maps.app.goo.gl/…/place/…?…place_id=ChIJ…   (param)
 *   · https://www.google.com/maps/place/…!19s0x…:0x…      (token !19s)
 *   · https://www.google.com/maps/place/…/data=…           (feature id 0x..:0x..)
 *   · ChIJ… o 0x…:0x… directos                             (se normalizan)
 */
export function extractPlaceId(input: string | null | undefined): string | null {
  const raw = (input ?? '').trim();
  if (!raw) return null;

  // 1) Parámetro explícito place_id (enlaces oficiales de la API de Places).
  try {
    const url = new URL(raw);
    const pid = url.searchParams.get('place_id');
    if (pid && pid.length >= 5) return pid.slice(0, 120);
  } catch {
    /* no es una URL — se sigue intentando con patrones */
  }

  // 2) Token !19s0x…:0x… (compartir de Google Maps) o feature id suelto.
  const featured = raw.match(/!19s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/);
  if (featured) return featured[1];
  const hexPair = raw.match(/(?:^|[/?=&])((?:0x[0-9a-fA-F]{8,}):0x[0-9a-fA-F]{4,})/);
  if (hexPair) return hexPair[1];

  // 3) Place ID «ChIJ…» clásico (o alfanumérico de la API).
  const chij = raw.match(/\b(ChIJ[A-Za-z0-9_-]{10,})\b/);
  if (chij) return chij[1];

  // 4) Cadena que ya es un id razonable (sin espacios ni /): se conserva.
  if (!/\s/.test(raw) && !raw.startsWith('http') && /^[\w:.-]{5,120}$/.test(raw)) return raw;

  return null;
}
