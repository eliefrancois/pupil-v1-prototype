-- Broad queries ("un", "university of") match thousands of rows, and ranking
-- them recomputed unaccent(name) several times per row (~800ms). Store the
-- normalized name once and search/rank on the column instead.

alter table public.colleges
  add column if not exists search_name text
  generated always as (public.college_search_text(name)) stored;

create index if not exists colleges_search_name_trgm_idx
  on public.colleges using gin (search_name public.gin_trgm_ops);

-- Superseded by colleges_search_name_trgm_idx (added in the previous
-- migration, never used outside search_colleges).
drop index if exists public.colleges_name_search_trgm_idx;

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
  with input as (
    select public.college_search_text(btrim(q)) as term
  ),
  pattern as (
    select
      term,
      regexp_replace(
        replace(replace(replace(term, '\', '\\'), '%', '\%'), '_', '\_'),
        '\s+', '%', 'g'
      ) as words
    from input
  )
  select c.id, c.name, c.state, c.country, c.country_code, c.state_province
  from public.colleges c, pattern p
  where length(p.term) >= 2
    and (
      c.search_name like '%' || p.words || '%'
      or p.term <% c.search_name
    )
  order by
    c.search_name = p.term desc,
    c.search_name like p.words || '%' desc,
    word_similarity(p.term, c.search_name) desc,
    similarity(p.term, c.search_name) desc,
    length(c.name)
  limit least(greatest(coalesce(max_results, 20), 1), 50);
$$;

grant execute on function public.search_colleges(text, integer) to anon, authenticated;
