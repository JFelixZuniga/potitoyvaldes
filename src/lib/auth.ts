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

/** Normaliza lo que escriba ella: "13/09/2024", "13-09-2024", "13092024". */
export function normalizar(valor: string): string {
  return valor
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\D/g, '');
}

export function esRespuestaCorrecta(valor: string, esperado: string): boolean {
  const v = normalizar(valor);
  const e = normalizar(esperado);
  if (!v) return false;
  // Acepta dd/mm/aaaa y dd/mm/aa (13092024 y 130924).
  return v === e || (e.length === 8 && v === e.slice(0, 4) + e.slice(6));
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
