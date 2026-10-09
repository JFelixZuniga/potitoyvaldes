import { defineMiddleware } from 'astro:middleware';
import { COOKIE_NAME, SECRETO, cookieValida } from './lib/auth';

/** Rutas accesibles sin haber pasado el gate. */
const ABIERTAS = ['/entrada', '/api/entrar', '/_astro', '/favicon.svg', '/og.png', '/robots.txt'];

export const onRequest = defineMiddleware(async (context, next) => {
  const ruta = context.url.pathname;

  if (ABIERTAS.some((abierta) => ruta === abierta || ruta.startsWith(abierta + '/'))) {
    return next();
  }

  const autorizada = await cookieValida(context.cookies.get(COOKIE_NAME)?.value, SECRETO);
  if (!autorizada) {
    return context.redirect('/entrada', 302);
  }

  const respuesta = await next();
  respuesta.headers.set('X-Robots-Tag', 'noindex, nofollow');
  respuesta.headers.set('Referrer-Policy', 'no-referrer');
  respuesta.headers.set('Cache-Control', 'private, no-store');
  return respuesta;
});
