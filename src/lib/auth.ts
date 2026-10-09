/**
 * Gate del sitio: cookie firmada con HMAC-SHA256 usando Web Crypto
 * (disponible en Node y en el edge, sin dependencias externas).
 *
 * La cookie guarda solo una fecha de expiración firmada. Si alguien la
 * edita, la firma deja de calzar y el gate vuelve a pedir la fecha.
 */

export const COOKIE_NAME = 'valdes_pass';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 días

/** Fecha de matrimonio. Se compara normalizada: sirven 13/09/2024, 13-09-2024 o 13092024. */
export const RESPUESTA = '13092024';

/** Clave para firmar la cookie. Cambiarla invalida todas las cookies emitidas. */
export const SECRETO = 'valdes-girasol-13092024';

const encoder = new TextEncoder();

async function key(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

type Fecha = { d: number; m: number; a: number };

/**
 * Interpreta lo que escriba ella, sea como sea: "13/09/2024", "13/9/24",
 * "13-09-2024", "13092024", "1392024", "13 de septiembre de 2024",
 * "13 sept 2024" o "2024-09-13". Devuelve null si no se puede leer.
 */
export function leerFecha(valor: string): Fecha | null {
  let t = valor
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Meses con nombre ("septiembre", "sept", "set") pasan a n\u00famero.
  t = t.replace(/[a-z]+/g, (palabra) => {
    const i = MESES.indexOf(palabra === 'set' || palabra.startsWith('setiem') ? 'sep' : palabra.slice(0, 3));
    return i >= 0 && palabra.length >= 3 ? ` ${i + 1} ` : ' ';
  });

  const partes = t.match(/\d+/g) ?? [];
  const anio = (a: number) => (a < 100 ? 2000 + a : a);

  if (partes.length >= 3) {
    const [x, y, z] = partes.map(Number);
    // aaaa-mm-dd (lo que entrega un selector de fecha) o dd-mm-aaaa.
    return partes[0].length === 4 ? { d: z, m: y, a: x } : { d: x, m: y, a: anio(z) };
  }

  if (partes.length === 1) {
    const s = partes[0];
    // Todo junto: ddmmaaaa, ddmaaaa, ddmmaa o ddmaa.
    const a = s.length >= 7 ? s.slice(-4) : s.slice(-2);
    const dm = s.slice(0, s.length - a.length);
    if (dm.length < 3 || dm.length > 4) return null;
    return { d: Number(dm.slice(0, 2)), m: Number(dm.slice(2)), a: anio(Number(a)) };
  }

  return null;
}

export function esRespuestaCorrecta(valor: string, esperado: string): boolean {
  const v = leerFecha(valor);
  const e = leerFecha(esperado);
  return !!v && !!e && v.d === e.d && v.m === e.m && v.a === e.a;
}

export async function firmarCookie(secret: string): Promise<string> {
  const expira = Date.now() + COOKIE_MAX_AGE * 1000;
  const payload = String(expira);
  const firma = toHex(await crypto.subtle.sign('HMAC', await key(secret), encoder.encode(payload)));
  return `${payload}.${firma}`;
}

export async function cookieValida(valor: string | undefined, secret: string): Promise<boolean> {
  if (!valor) return false;
  const [payload, firma] = valor.split('.');
  if (!payload || !firma) return false;
  if (Number(payload) < Date.now()) return false;
  const esperada = await crypto.subtle.sign('HMAC', await key(secret), encoder.encode(payload));
  return toHex(esperada) === firma;
}
