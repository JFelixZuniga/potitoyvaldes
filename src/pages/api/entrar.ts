import type { APIRoute } from 'astro';
import { COOKIE_NAME, COOKIE_MAX_AGE, RESPUESTA, SECRETO, esRespuestaCorrecta, firmarCookie } from '../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const fecha = String(form.get('fecha') ?? '');
  const intentos = String(form.get('intentos') ?? '1');

  if (!esRespuestaCorrecta(fecha, RESPUESTA)) {
    return redirect(`/entrada?e=${intentos === '2' ? '2' : '1'}`, 302);
  }

  cookies.set(COOKIE_NAME, await firmarCookie(SECRETO), {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  });

  return redirect('/', 302);
};
