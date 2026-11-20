# LFZ BarberShop · Turnos online

Next.js 15 + TypeScript + Tailwind 4 + Supabase (Postgres, Auth, Realtime, RLS) + Vercel.

## Puesta en marcha
1. **Supabase**: proyecto nuevo y exclusivo. SQL Editor → correr `supabase/migrations/0001_init.sql` y después `supabase/migrations/0002_galeria_y_turnos_manuales.sql` y `0003_notificaciones_estadisticas_urgencia.sql` (galería, turnos manuales, precio por turno, horarios corregidos, notificaciones, urgencia).
2. **Auth**: Authentication → Users → *Add user* (tu email y contraseña, marcá *Auto confirm*). Después corré `supabase/seed_admin.sql` con tu email.
3. **Variables**: copiá `.env.example` a `.env.local` y completá URL y anon key (Project Settings → API).
4. `npm install && npm run dev` → http://localhost:3000 y http://localhost:3000/admin/login
5. **Vercel**: Import del repo → agregá las mismas variables de entorno → Deploy.
6. Editá en la tabla `settings` (WhatsApp con código de país, ej. `5493537123456`, dirección, Instagram), `services` y `business_hours`.
7. Fotos: copiá a `public/gallery/` y agregalas al array `GALLERY` en `src/app/page.tsx`.

## Seguridad
- El público no puede leer `appointments`, `customers` ni `time_blocks` (RLS); solo usa las funciones `get_availability`, `create_appointment_request` y `get_my_appointment`.
- Doble reserva imposible: constraint `appointments_no_overlap` (rango horario) + validación en la función.
- `/admin` protegido por middleware + `is_admin()` + RLS. No hay claves privadas en el código.

## Pendiente (próximas fases)
Calendario admin (día/semana/mes), modificar turnos, expiración automática con pg_cron y protección anti-spam.

## Notificaciones push (admin)
1. Cargá en Vercel `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` y `SUPABASE_SERVICE_ROLE_KEY`, y redeployá.
2. Entrá a `/admin` desde el celular, instalá la app (Chrome: menú > Instalar app; iPhone: Compartir > Agregar a inicio) y tocá **Activar** en la tarjeta de notificaciones.
3. Cada solicitud nueva dispara un aviso; al tocarlo se abre el panel.
