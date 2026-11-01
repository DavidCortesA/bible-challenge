# Bible Challenge · Mi lectura bíblica

Dashboard personal para llevar el progreso de lectura de la Biblia. Pensado para el celular: se instala como app y funciona sin internet.

- **Inicio**: la lectura de hoy del plan, el siguiente capítulo, porcentaje total, Antiguo/Nuevo Testamento, tu meta, avance por sección, racha y actividad.
- **Biblia**: marca capítulo por capítulo (o un libro completo, o un rango) los 1,189 capítulos. Es tu progreso total, no se reinicia.
- **Plan anual**: plan de 52 semanas dividido en lecturas diarias. Empieza de cero cada año (cada año guarda sus marcas). Opcionalmente marca también los capítulos en tu progreso de la Biblia.
- **Historial**: capítulos por mes, días leyendo, mejor racha y libros terminados en cada año.
- **Ajustes**: tema, instalar en el celular, recordatorio diario para tu calendario (.ics, con la lectura del plan de cada día) y respaldo en JSON.

Al tocar **Leer** se abre el pasaje en bible.com (RVR1960); al volver, la app pregunta si lo terminaste para marcarlo.

Los datos se guardan en el dispositivo (`localStorage`). Descarga un respaldo de vez en cuando desde **Ajustes**.

## Desarrollo

```bash
npm install
npm run dev
```

## Deploy en Vercel

Importa el repositorio en Vercel; detecta Vite automáticamente (`npm run build`, salida en `dist`). No necesita variables de entorno.

Hecho con React, Vite, Tailwind CSS y [Lucide](https://lucide.dev).
