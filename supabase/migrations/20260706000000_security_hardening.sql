-- Security hardening for production MVP.
-- Adds an atomic usage counter increment RPC callable only by service_role.

create or replace function public.increment_usage_counter(
  p_user_id uuid,
  p_period_key text,
  p_counter_name text
)
returns table (
  scans_used integer,
  files_uploaded integer,
  ai_requests_used integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_counter_name not in (
    'scans_used',
    'files_uploaded',
    'ai_requests_used'
  ) then
    raise exception 'Invalid usage counter name';
  end if;

  insert into public.usage_counters (
    user_id,
    period_key
  )
  values (
    p_user_id,
    p_period_key
  )
  on conflict (user_id, period_key) do nothing;

  return query
  update public.usage_counters uc
  set
    scans_used = case
      when p_counter_name = 'scans_used' then uc.scans_used + 1
      else uc.scans_used
    end,
    files_uploaded = case
      when p_counter_name = 'files_uploaded' then uc.files_uploaded + 1
      else uc.files_uploaded
    end,
    ai_requests_used = case
      when p_counter_name = 'ai_requests_used' then uc.ai_requests_used + 1
      else uc.ai_requests_used
    end,
    updated_at = now()
  where uc.user_id = p_user_id
    and uc.period_key = p_period_key
  returning uc.scans_used, uc.files_uploaded, uc.ai_requests_used;
end;
$$;

revoke all on function public.increment_usage_counter(uuid, text, text) from public;
revoke all on function public.increment_usage_counter(uuid, text, text) from anon;
revoke all on function public.increment_usage_counter(uuid, text, text) from authenticated;
grant execute on function public.increment_usage_counter(uuid, text, text) to service_role;

-- Trigger helper functions do not need to be directly executable through the API.
revoke all on function public.set_updated_at() from public;
revoke all on function public.set_updated_at() from anon;
revoke all on function public.set_updated_at() from authenticated;
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;
