-- LFZ BarberShop · migración 2: galería administrable + turnos manuales.
-- Correr completo en Supabase > SQL Editor (después de 0001_init.sql).

-- ===== Galería =====
create table if not exists gallery_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('image','video')),
  url text not null,
  storage_path text not null,
  fit text not null default 'cover' check (fit in ('cover','contain')),
  focus_x int not null default 50 check (focus_x between 0 and 100),
  focus_y int not null default 50 check (focus_y between 0 and 100),
  zoom numeric(3,2) not null default 1 check (zoom between 1 and 3),
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table gallery_items enable row level security;
drop policy if exists gallery_read on gallery_items;
drop policy if exists gallery_admin on gallery_items;
create policy gallery_read on gallery_items for select using (is_active);
create policy gallery_admin on gallery_items for all using (is_admin()) with check (is_admin());

-- Almacenamiento de fotos y videos (público para leer, solo admin escribe)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery', 'gallery', true, 52428800,
        array['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
                               allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists gallery_public_read on storage.objects;
drop policy if exists gallery_admin_insert on storage.objects;
drop policy if exists gallery_admin_update on storage.objects;
drop policy if exists gallery_admin_delete on storage.objects;
create policy gallery_public_read on storage.objects for select using (bucket_id = 'gallery');
create policy gallery_admin_insert on storage.objects for insert with check (bucket_id = 'gallery' and is_admin());
create policy gallery_admin_update on storage.objects for update using (bucket_id = 'gallery' and is_admin());
create policy gallery_admin_delete on storage.objects for delete using (bucket_id = 'gallery' and is_admin());

-- ===== Turno manual (solo admin): queda confirmado y valida solapamientos =====
create or replace function admin_create_appointment(
  p_service_id uuid, p_date date, p_start time, p_name text, p_phone text, p_notes text default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_phone text; v_dur int; v_cust uuid; v_code text;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  v_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if length(v_phone) < 8 or length(v_phone) > 15 then raise exception 'invalid_phone'; end if;
  if length(trim(coalesce(p_name, ''))) < 2 then raise exception 'invalid_name'; end if;
  select duration_minutes into v_dur from services where id = p_service_id;
  if v_dur is null then raise exception 'invalid_service'; end if;
  insert into customers(full_name, phone) values (trim(p_name), v_phone)
    on conflict (phone) do update set updated_at = now() returning id into v_cust;
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  begin
    insert into appointments(customer_id, service_id, appointment_date, start_time, end_time, status,
                             customer_notes, booking_code, confirmed_at)
    values (v_cust, p_service_id, p_date, p_start, (p_date + p_start + make_interval(mins => v_dur))::time,
            'confirmed', left(p_notes, 300), v_code, now());
  exception when exclusion_violation then raise exception 'slot_taken';
  end;
  return v_code;
end $$;
revoke execute on function admin_create_appointment(uuid, date, time, text, text, text) from public, anon;
grant execute on function admin_create_appointment(uuid, date, time, text, text, text) to authenticated;
