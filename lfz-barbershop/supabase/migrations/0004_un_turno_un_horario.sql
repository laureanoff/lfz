-- LFZ BarberShop · migración 4: cada reserva ocupa UN solo horario en el calendario.
-- Correr completo en Supabase > SQL Editor (después de 0001, 0002 y 0003).
--
-- Los horarios libres se generan cada "duración del corte" (o cada "intervalo" de Ajustes si es mayor).
-- Si existe un turno desfasado de esa grilla (por ejemplo cargado a mano a las 14:55), se muestra como
-- UN solo horario ocupado y la grilla sigue normal después, en vez de tapar dos casilleros.
create or replace function get_availability(p_date date, p_service_id uuid)
returns table(slot_time time, state text)
language plpgsql security definer set search_path = public as $$
declare
  v_dur int; v_step int; v_notice int; v_max int; v_now timestamp;
  h record; a record; v_t timestamp; v_e timestamp; v_close timestamp; v_skip timestamp;
begin
  select duration_minutes into v_dur from services where id = p_service_id and is_active;
  if v_dur is null then return; end if;
  select slot_step_minutes, min_notice_minutes, max_advance_days into v_step, v_notice, v_max from settings where id = 1;
  v_step := greatest(coalesce(v_step, 0), v_dur);
  v_notice := coalesce(v_notice, 0);
  v_now := now() at time zone 'America/Argentina/Cordoba';
  if p_date < v_now::date or p_date > v_now::date + coalesce(v_max, 30) then return; end if;

  for h in select open_time, close_time from business_hours
           where weekday = extract(dow from p_date)::int order by open_time loop
    v_t := p_date + h.open_time; v_close := p_date + h.close_time; v_skip := v_t;
    while v_t + make_interval(mins => v_dur) <= v_close loop
      v_e := v_t + make_interval(mins => v_dur);
      if v_t >= v_skip then
        select a2.status as st, (a2.appointment_date + a2.start_time) as s, (a2.appointment_date + a2.end_time) as e into a
          from appointments a2
         where a2.status in ('pending', 'confirmed', 'completed')
           and tsrange(a2.appointment_date + a2.start_time, a2.appointment_date + a2.end_time) && tsrange(v_t, v_e)
         order by a2.appointment_date + a2.start_time limit 1;
        if found then
          v_skip := a.e;   -- ese turno "consume" los casilleros que toca: se muestra una sola vez
          if a.s >= v_now + make_interval(mins => v_notice) then
            slot_time := a.s::time; state := case when a.st = 'pending' then 'pending' else 'confirmed' end; return next;
          end if;
        elsif v_t >= v_now + make_interval(mins => v_notice) then
          slot_time := v_t::time;
          state := case when exists (select 1 from time_blocks b where tsrange(b.start_datetime, b.end_datetime) && tsrange(v_t, v_e))
                        then 'blocked' else 'available' end;
          return next;
        end if;
      end if;
      v_t := v_t + make_interval(mins => v_step);
    end loop;
  end loop;
end $$;
