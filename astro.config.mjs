// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  security: {
    // Sin esto Astro no confía en el Host ni en X-Forwarded-Proto que manda Vercel,
    // la URL interna queda como https://localhost y el chequeo CSRF rechaza el POST
    // ("Cross-site POST form submissions are forbidden"). Vercel solo enruta hacia
    // la función los dominios asignados al proyecto, así que confiar en https basta.
    allowedDomains: [{ protocol: 'https' }],
  },
});
