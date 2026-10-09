# Feliz cumpleaños, Valdés 🌻

Sitio de una página en **Astro 5** con el **adapter de Vercel**, desplegado como Vercel Function (Node 22). El contenido está protegido por un gate propio: hasta que no se acierta la fecha de matrimonio, el HTML del regalo nunca sale del servidor.

## Cómo funciona el gate

1. `src/middleware.ts` intercepta cada request. Si no hay cookie válida, redirige a `/entrada`.
2. `/entrada` muestra el formulario (funciona sin JavaScript) y hace POST a `/api/entrar`.
3. `src/pages/api/entrar.ts` compara la respuesta con `RESPUESTA`, y si calza firma una cookie `HttpOnly` con HMAC-SHA256 usando `SECRETO` (Web Crypto, sin dependencias).
4. `src/lib/auth.ts` valida la firma y la expiración en cada visita. Editar la cookie a mano invalida la firma.

La fecha se normaliza antes de comparar, así que sirven `13/09/2024`, `13-09-2024`, `13092024` y `130924`.

## Puesta en marcha

```bash
npm install
npm run dev                      # http://localhost:4321
```

## Despliegue en Vercel

1. Sube el proyecto a GitHub/GitLab e impórtalo en Vercel (**Add New → Project**). Detecta Astro solo; no hace falta `vercel.json`.
2. Deploy. No hay variables de entorno que configurar.

También se puede desplegar desde la terminal:

```bash
npm i -g vercel
npm run deploy        # vercel --prod
```

### Dominio propio

En Vercel: tu proyecto → Settings → Domains → Add. Si lo compras en NIC.cl, configura en NIC los registros DNS que te indique Vercel (registro `A` a `76.76.21.21` para el dominio raíz o `CNAME` a `cname.vercel-dns.com` para `www`).

## Qué editar

Casi todo el contenido vive en `src/data/datos.json`: hitos, estadísticas, gráfico mensual, frases, preguntas del quiz y cláusulas del acta. Los componentes solo lo renderizan.

```
src/
├── components/   Girasol, Hero, Historia, Numeros, Frases, Office, Quiz, Acta
├── data/         datos.json  ← el contenido
├── layouts/      Base.astro
├── lib/          auth.ts (HMAC) y negrita.ts
├── pages/        index.astro, entrada.astro, api/entrar.ts
├── styles/       global.css
└── middleware.ts
```

## Detalles técnicos

- `index.astro` usa `prerender = false`: se renderiza en la Vercel Function y así el middleware alcanza a protegerlo. Los únicos archivos estáticos (`/_astro`, favicon, robots) son públicos a propósito.
- La respuesta (`RESPUESTA`) y la clave de firma (`SECRETO`) están en `src/lib/auth.ts`. Si el repo es público, cualquiera puede leerlas ahí; si eso importa, déjalo privado.
- El girasol (42 pétalos y 263 semillas en espiral de Fibonacci) y el gráfico de barras se generan en el servidor: salen como SVG y HTML listos, sin JavaScript en el cliente.
- El contador de días se calcula por request, así que nunca queda desactualizado.
- Lo único que lleva JavaScript de cliente es el quiz.
- Astro trae protección CSRF activa (`checkOrigin`), por eso el POST del formulario exige un `Origin` del mismo sitio.
- Las respuestas llevan `X-Robots-Tag: noindex` y `Cache-Control: private, no-store`.
