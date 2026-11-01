# Bible Challenge · Mi lectura bíblica

Dashboard personal para llevar el progreso de lectura de la Biblia.

- **Biblia**: marca capítulo por capítulo (o un libro completo, o un rango) los 1,189 capítulos de los 66 libros. Es tu progreso total, no se reinicia.
- **Plan de 52 semanas**: plan anual que empieza de cero cada año (cada año guarda sus propias marcas). Opcionalmente puede marcar también los capítulos en tu progreso de la Biblia.
- **Inicio**: porcentaje total, Antiguo/Nuevo Testamento, avance por sección, racha de días, actividad y la siguiente lectura sugerida.

Entras con una contraseña y tu progreso se guarda en Upstash Redis, así que se ve igual en cualquier dispositivo. Cada cambio se guarda solo y, al volver a la app, trae lo último de los otros dispositivos (gana la edición más reciente). También hay una copia local y respaldo en JSON desde **Ajustes**.

## Desarrollo

```bash
cp .env.example .env.local   # y pon tu APP_PASSWORD
npm install
npm run dev
```

En local, `/api` funciona con una base de datos en memoria (se borra al reiniciar el servidor), salvo que pongas las variables de Upstash en `.env.local`.

## Deploy en Vercel

1. Importa el repositorio en Vercel (detecta Vite solo).
2. En el proyecto: **Storage → Create Database → Upstash for Redis** (plan gratis) y conéctala al proyecto. Esto agrega `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
3. En **Settings → Environment Variables** agrega `APP_PASSWORD` con tu contraseña.
4. Vuelve a desplegar (**Deployments → Redeploy**).

Si cambias `APP_PASSWORD`, se cierra la sesión en todos los dispositivos.

Hecho con React, Vite, Tailwind CSS y [Lucide](https://lucide.dev).
