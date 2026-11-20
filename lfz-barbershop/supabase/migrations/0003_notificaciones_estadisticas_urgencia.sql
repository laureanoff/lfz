-- LFZ BarberShop · migración 3. Correr completo en Supabase > SQL Editor (después de 0001 y 0002).

-- 1) Precio guardado en cada turno (para estadísticas que no cambien si cambiás el precio después)
alter table appointments add column if not exists price numeric(10,2);
alter table appointments add column if not exists push_sent_at timestamptz;
update appointments a set price = s.price from services s where a.service_id = s.id and a.price is null;
create or replace function appointments_set_price() returns trigger language plpgsql as $$
begin
  if new.price is null then select price into new.price from services where id = new.service_id; end if;
  return new;
end $$;
drop trigger if exists appointments_set_price_trg on appointments;
create trigger appointments_set_price_trg before insert on appointments for each row execute function appointments_set_price();

-- 2) Arreglo: una reserva ocupaba 3 horarios. Ahora los horarios se generan cada "duración del corte"
--    (o cada "intervalo" de Ajustes si es mayor), así una reserva ocupa exactamente 1.
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
  v_step := greatest(coalesce(v_step, 0), v_dur);
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

-- 3) Turnos libres por día (para mostrar urgencia en la web)
create or replace function get_availability_summary(p_service_id uuid)
returns table(day date, free int)
language plpgsql security definer stable set search_path = public as $$
declare v_max int; v_today date; d date;
begin
  select max_advance_days into v_max from settings where id = 1;
  v_today := (now() at time zone 'America/Argentina/Cordoba')::date;
  for d in select generate_series(v_today, v_today + coalesce(v_max, 30), interval '1 day')::date loop
    day := d;
    select count(*)::int into free from get_availability(d, p_service_id) g where g.state = 'available';
    return next;
  end loop;
end $$;

-- 4) Suscripciones de notificaciones push (solo admin)
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table push_subscriptions enable row level security;
drop policy if exists push_admin on push_subscriptions;
create policy push_admin on push_subscriptions for all using (is_admin()) with check (is_admin());

-- 5) Foto principal de la portada, editable desde el admin
alter table settings add column if not exists hero_url text;
alter table settings add column if not exists hero_kind text not null default 'image';
alter table settings add column if not exists hero_fit text not null default 'cover';
alter table settings add column if not exists hero_focus_x int not null default 50;
alter table settings add column if not exists hero_focus_y int not null default 50;
alter table settings add column if not exists hero_zoom numeric(3,2) not null default 1;
