-- 1) Supabase > Authentication > Users > Add user (tu email + contraseña, "Auto confirm").
-- 2) Reemplazá el email y corré esto para darte rol de administrador:
insert into profiles(id, full_name, role)
select id, 'Admin LFZ', 'admin' from auth.users where email = 'TU-EMAIL@ejemplo.com';
