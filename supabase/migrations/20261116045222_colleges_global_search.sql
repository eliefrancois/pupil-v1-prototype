-- Global university list: adds location/provenance columns to colleges so we
-- can import Hipo's world university list alongside the curated US rows, plus
-- a server-side search function so the mentor picker no longer loads the whole
-- table. Additive only: no columns dropped, existing ids and FKs untouched.
--
-- pg_trgm and colleges_name_trgm_idx (GIN, gin_trgm_ops on name) already exist.

create extension if not exists pg_trgm;

alter table public.colleges
  add column if not exists country text,
  add column if not exists country_code text,
  add column if not exists state_province text,
  add column if not exists domains text[] not null default '{}',
  add column if not exists web_pages text[] not null default '{}',
  add column if not exists source text not null default 'existing',
  add column if not exists external_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'colleges_source_check'
  ) then
    alter table public.colleges
      add constraint colleges_source_check
      check (source in ('existing', 'hipo', 'manual'));
  end if;
end $$;

-- Stable key for imported rows ("hipo:<cc>:<normalized name>") so reruns of
-- scripts/import-world-universities.ts upsert instead of duplicating.
create unique index if not exists colleges_external_id_key
  on public.colleges (external_id);

create index if not exists colleges_country_code_idx
  on public.colleges (country_code);

create index if not exists colleges_name_trgm_idx
  on public.colleges using gin (name gin_trgm_ops);

-- Backfill country data for the curated rows. Their `state` column holds a US
-- state code for nearly all rows and a free-form region for a handful.
update public.colleges c
set country = m.country,
    country_code = m.country_code,
    state_province = m.state_province
from (
  select id,
    case
      when state = 'PR' then 'Puerto Rico'
      when state = 'GU' then 'Guam'
      when state = 'VI' then 'Virgin Islands, U.S.'
      when state = 'FM' then 'Micronesia, Federated States of'
      when state ~ '^[A-Z]{2}$' then 'United States'
      when state = 'England' then 'United Kingdom'
      when state in ('BC, Canada', 'Ontario, Canada', 'Quebec') then 'Canada'
      else state
    end as country,
    case
      when state in ('PR', 'GU', 'VI', 'FM') then state
      when state ~ '^[A-Z]{2}$' then 'US'
      when state = 'England' then 'GB'
      when state in ('BC, Canada', 'Ontario, Canada', 'Quebec') then 'CA'
      when state = 'Austria' then 'AT'
      when state = 'Italy' then 'IT'
      when state = 'Switzerland' then 'CH'
      when state = 'United Arab Emirates' then 'AE'
    end as country_code,
    case
      when state ~ '^[A-Z]{2}$' and state not in ('PR', 'GU', 'VI', 'FM') then state
      when state = 'England' then 'England'
      when state = 'BC, Canada' then 'British Columbia'
      when state = 'Ontario, Canada' then 'Ontario'
      when state = 'Quebec' then 'Quebec'
    end as state_province
  from public.colleges
  where source = 'existing' and country_code is null
) m
where c.id = m.id;

-- Top matches for the college picker. Exact and prefix matches first, then
-- trigram word similarity so typos and partial words still land
-- ("erasmus rotter", "indiana tech").
create or replace function public.search_colleges(
  q text,
  max_results integer default 20
)
returns table (
  id uuid,
  name text,
  state text,
  country text,
  country_code text,
  state_province text
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select c.id, c.name, c.state, c.country, c.country_code, c.state_province
  from public.colleges c
  where length(btrim(q)) >= 2
    and (
      c.name ilike '%' || replace(replace(replace(btrim(q), '\', '\\'), '%', '\%'), '_', '\_') || '%'
      or btrim(q) <% c.name
    )
  order by
    lower(c.name) = lower(btrim(q)) desc,
    c.name ilike replace(replace(replace(btrim(q), '\', '\\'), '%', '\%'), '_', '\_') || '%' desc,
    word_similarity(btrim(q), c.name) desc,
    similarity(btrim(q), c.name) desc,
    length(c.name)
  limit least(greatest(coalesce(max_results, 20), 1), 50);
$$;

grant execute on function public.search_colleges(text, integer) to anon, authenticated;
