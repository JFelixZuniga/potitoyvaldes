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
    // En la portada se muestra el gate ahí mismo, sin redirigir: así la vista
    // previa de WhatsApp lee sus etiquetas og: directo del link compartido.
    if (ruta === '/' && context.request.method === 'GET') {
      const gate = await next('/entrada');
      gate.headers.set('Cache-Control', 'private, no-store');
      return gate;
    }
    return context.redirect('/entrada', 302);
  }

  const respuesta = await next();
  respuesta.headers.set('X-Robots-Tag', 'noindex, nofollow');
  respuesta.headers.set('Referrer-Policy', 'no-referrer');
  respuesta.headers.set('Cache-Control', 'private, no-store');
  return respuesta;
});
