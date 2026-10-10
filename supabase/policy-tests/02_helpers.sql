-- Tiny assertion helpers (plain SQL, no pgTAP needed). Each failure raises,
-- so psql with ON_ERROR_STOP=1 exits non-zero.

create schema tests;
grant usage on schema tests to anon, authenticated, service_role;

create function tests.ok(cond boolean, description text) returns void language plpgsql as $$
begin
  if cond is distinct from true then
    raise exception 'FAIL: %', description;
  end if;
  raise notice 'ok - %', description;
end
$$;

-- Asserts that a statement is rejected (RLS WITH CHECK / missing privilege).
create function tests.denied(stmt text, description text) returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when insufficient_privilege then
    raise notice 'ok - % (denied)', description;
    return;
  end;
  raise exception 'FAIL: % (statement succeeded: %)', description, stmt;
end
$$;

-- Number of rows a statement touched (RLS USING silently filters rows).
create function tests.affected(stmt text) returns integer language plpgsql as $$
declare
  n integer;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n;
end
$$;

-- Switch the "API caller": 'anon', or the uuid of an authenticated user.
create function tests.claims(who text) returns void language plpgsql as $$
begin
  if who = 'anon' then
    perform set_config('request.jwt.claim.role', 'anon', false);
    perform set_config('request.jwt.claim.sub', '', false);
  else
    perform set_config('request.jwt.claim.role', 'authenticated', false);
    perform set_config('request.jwt.claim.sub', who, false);
  end if;
end
$$;

grant execute on all functions in schema tests to anon, authenticated, service_role;
