# Bible Challenge · Mi lectura bíblica

Dashboard personal para llevar el progreso de lectura de la Biblia.

- **Biblia**: marca capítulo por capítulo (o un libro completo, o un rango) los 1,189 capítulos de los 66 libros. Es tu progreso total, no se reinicia.
- **Plan de 52 semanas**: plan anual que empieza de cero cada año (cada año guarda sus propias marcas). Opcionalmente puede marcar también los capítulos en tu progreso de la Biblia.
- **Inicio**: porcentaje total, Antiguo/Nuevo Testamento, avance por sección, racha de días, actividad y la siguiente lectura sugerida.

Los datos se guardan en `localStorage` del navegador. Desde **Ajustes** puedes descargar e importar un respaldo en JSON (sirve también para pasar el progreso a otro dispositivo).

## Desarrollo

```bash
npm install
npm run dev
```

## Deploy en Vercel

Importa el repositorio en Vercel; detecta Vite automáticamente (`npm run build`, salida en `dist`).

Hecho con React, Vite, Tailwind CSS y [Lucide](https://lucide.dev).
