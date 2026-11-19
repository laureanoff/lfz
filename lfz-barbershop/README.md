# LFZ BarberShop · Turnos online

Next.js 15 + TypeScript + Tailwind 4 + Supabase (Postgres, Auth, Realtime, RLS) + Vercel.

## Puesta en marcha
1. **Supabase**: proyecto nuevo y exclusivo. SQL Editor → pegar y correr `supabase/migrations/0001_init.sql`.
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
Calendario admin, clientes, turnos manuales y modificación de turnos.
