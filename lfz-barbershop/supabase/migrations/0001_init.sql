-- LFZ BarberShop · esquema inicial. Correr completo en Supabase > SQL Editor.
create extension if not exists btree_gist;

-- ========== TABLAS ==========
create table settings (
  id int primary key default 1 check (id = 1),
  shop_name text not null default 'LFZ BarberShop',
  address text not null default 'Dirección a completar',
  instagram text not null default 'lfz_barbershop',
  whatsapp text not null default '5490000000000',
  slot_step_minutes int not null default 15 check (slot_step_minutes between 5 and 120),
  min_notice_minutes int not null default 60,
  max_advance_days int not null default 30,
  pending_expiry_hours int not null default 12,
  cancellation_policy text not null default 'Avisá con al menos 2 horas de anticipación.'
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  duration_minutes int not null check (duration_minutes between 5 and 480),
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  service_id uuid not null references services(id),
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','rejected','cancelled','completed','no_show')),
  customer_notes text,
  admin_notes text,
  booking_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  check (end_time > start_time),
  -- Evita superposición a nivel base de datos (pendiente y confirmado ocupan horario)
  constraint appointments_no_overlap exclude using gist (
    tsrange(appointment_date + start_time, appointment_date + end_time) with &&
  ) where (status in ('pending','confirmed','completed'))
);
create index appointments_date_idx on appointments(appointment_date, start_time);
create index appointments_status_idx on appointments(status);

create table business_hours (  -- varias filas por día = varios intervalos
  id uuid primary key default gen_random_uuid(),
  weekday int not null check (weekday between 0 and 6), -- 0 = domingo
  open_time time not null,
  close_time time not null,
  check (close_time > open_time)
);

create table time_blocks (
  id uuid primary key default gen_random_uuid(),
  start_datetime timestamp not null,
  end_datetime timestamp not null,
  reason text,
  created_at timestamptz not null default now(),
  check (end_datetime > start_datetime)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  appointment_id uuid references appointments(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ========== TRIGGERS ==========
create or replace function appointments_guard() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'confirmed' then new.confirmed_at := now(); end if;
    if new.status in ('cancelled','rejected') then new.cancelled_at := now(); end if;
  end if;
  if new.status in ('pending','confirmed') and (
       tg_op = 'INSERT' or old.status not in ('pending','confirmed')
       or new.appointment_date <> old.appointment_date or new.start_time <> old.start_time or new.end_time <> old.end_time) then
    if exists (select 1 from time_blocks b
               where tsrange(b.start_datetime, b.end_datetime) && tsrange(new.appointment_date + new.start_time, new.appointment_date + new.end_time)) then
      raise exception 'slot_blocked';
    end if;
  end if;
  return new;
end $$;
create trigger appointments_guard_trg before insert or update on appointments
  for each row execute function appointments_guard();

-- ========== SEGURIDAD (RLS) ==========
create or replace function is_admin() returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

alter table settings enable row level security;
alter table profiles enable row level security;
alter table services enable row level security;
alter table customers enable row level security;
alter table appointments enable row level security;
alter table business_hours enable row level security;
alter table time_blocks enable row level security;
alter table notifications enable row level security;

create policy settings_read on settings for select using (true);
create policy services_read on services for select using (is_active);
create policy hours_read on business_hours for select using (true);
create policy profiles_read on profiles for select using (id = auth.uid() or is_admin());

create policy settings_admin on settings for all using (is_admin()) with check (is_admin());
create policy services_admin on services for all using (is_admin()) with check (is_admin());
create policy hours_admin on business_hours for all using (is_admin()) with check (is_admin());
create policy customers_admin on customers for all using (is_admin()) with check (is_admin());
create policy appointments_admin on appointments for all using (is_admin()) with check (is_admin());
create policy blocks_admin on time_blocks for all using (is_admin()) with check (is_admin());
create policy notifications_admin on notifications for all using (is_admin()) with check (is_admin());
-- Público NO puede leer customers/appointments/time_blocks/notifications: usa las funciones de abajo.

-- ========== FUNCIONES PÚBLICAS ==========
create or replace function get_availability(p_date date, p_service_id uuid)
returns table(slot_time time, state text)
language plpgsql security definer set search_path = public as $$
declare
  v_dur int; v_step int; v_notice int; v_max int; v_now timestamp;
  h record; v_s timestamp; v_e timestamp; v_state text;
begin
  select duration_minutes into v_dur from services where id = p_service_id and is_active;
  if v_dur is null then return; end if;
  select slot_step_minutes, min_notice_minutes, max_advance_days into v_step, v_notice, v_max from settings where id = 1;
  v_now := now() at time zone 'America/Argentina/Cordoba';
  if p_date < v_now::date or p_date > v_now::date + v_max then return; end if;

  for h in select open_time, close_time from business_hours
           where weekday = extract(dow from p_date)::int order by open_time loop
    v_s := p_date + h.open_time;
    while v_s + make_interval(mins => v_dur) <= p_date + h.close_time loop
      v_e := v_s + make_interval(mins => v_dur);
      if v_s >= v_now + make_interval(mins => v_notice) then
        v_state := case
          when exists (select 1 from time_blocks b where tsrange(b.start_datetime, b.end_datetime) && tsrange(v_s, v_e)) then 'blocked'
          when exists (select 1 from appointments a where a.status in ('confirmed','completed')
                       and tsrange(a.appointment_date + a.start_time, a.appointment_date + a.end_time) && tsrange(v_s, v_e)) then 'confirmed'
          when exists (select 1 from appointments a where a.status = 'pending'
                       and tsrange(a.appointment_date + a.start_time, a.appointment_date + a.end_time) && tsrange(v_s, v_e)) then 'pending'
          else 'available' end;
        slot_time := v_s::time; state := v_state; return next;
      end if;
      v_s := v_s + make_interval(mins => v_step);
    end loop;
  end loop;
end $$;

create or replace function create_appointment_request(
  p_service_id uuid, p_date date, p_start time, p_name text, p_phone text, p_notes text default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_phone text; v_dur int; v_cust uuid; v_code text; v_id uuid; v_ok boolean;
begin
  v_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if length(v_phone) < 8 or length(v_phone) > 15 then raise exception 'invalid_phone'; end if;
  if length(trim(coalesce(p_name, ''))) < 2 or length(p_name) > 80 then raise exception 'invalid_name'; end if;
  select duration_minutes into v_dur from services where id = p_service_id and is_active;
  if v_dur is null then raise exception 'invalid_service'; end if;

  select exists (select 1 from get_availability(p_date, p_service_id) g
                 where g.slot_time = p_start and g.state = 'available') into v_ok;
  if not v_ok then raise exception 'slot_taken'; end if;

  insert into customers(full_name, phone) values (trim(p_name), v_phone)
    on conflict (phone) do update set updated_at = now() returning id into v_cust;
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  begin
    insert into appointments(customer_id, service_id, appointment_date, start_time, end_time, customer_notes, booking_code)
    values (v_cust, p_service_id, p_date, p_start, (p_date + p_start + make_interval(mins => v_dur))::time, left(p_notes, 300), v_code)
    returning id into v_id;
  exception when exclusion_violation then raise exception 'slot_taken';
  end;
  insert into notifications(type, appointment_id, message) values ('new_request', v_id, 'Nueva solicitud de ' || trim(p_name));
  return v_code;
end $$;

create or replace function get_my_appointment(p_code text)
returns table(booking_code text, status text, appointment_date date, start_time time, end_time time,
              service_name text, price numeric, customer_name text)
language sql security definer stable set search_path = public as $$
  select a.booking_code, a.status, a.appointment_date, a.start_time, a.end_time, s.name, s.price, c.full_name
  from appointments a join services s on s.id = a.service_id join customers c on c.id = a.customer_id
  where a.booking_code = upper(p_code) limit 1
$$;

-- Libera solicitudes pendientes vencidas. Programar (opcional) con pg_cron:
--   select cron.schedule('expire-pending', '*/10 * * * *', 'select expire_pending()');
create or replace function expire_pending() returns int language plpgsql security definer set search_path = public as $$
declare n int; v_h int;
begin
  select pending_expiry_hours into v_h from settings where id = 1;
  if v_h is null or v_h <= 0 then return 0; end if;
  update appointments set status = 'cancelled', admin_notes = coalesce(admin_notes || ' ', '') || '[Vencida automáticamente]'
   where status = 'pending' and created_at < now() - make_interval(hours => v_h);
  get diagnostics n = row_count; return n;
end $$;
revoke execute on function expire_pending() from public, anon, authenticated;

-- ========== REALTIME ==========
alter publication supabase_realtime add table notifications;

-- ========== DATOS INICIALES (PROVISORIOS, EDITABLES) ==========
insert into settings(id) values (1);
insert into services(name, description, price, duration_minutes, display_order) values
 ('Corte clásico', 'Corte a tijera o máquina con terminación prolija.', 8000, 30, 1),
 ('Fade', 'Degradé a medida, del más bajo al más alto.', 9000, 40, 2),
 ('Corte + barba', 'Corte completo y perfilado de barba.', 12000, 50, 3),
 ('Perfilado de barba', 'Contorno, línea y toalla caliente.', 5000, 20, 4),
 ('Diseño / freestyle', 'Líneas y diseños. Traé tu referencia.', 11000, 45, 5);
insert into business_hours(weekday, open_time, close_time)
select d, t.o::time, t.c::time from generate_series(1, 6) d,
 (values ('09:00','13:00'), ('16:00','20:00')) as t(o, c);
