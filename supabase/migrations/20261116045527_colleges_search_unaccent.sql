-- Make college search accent-insensitive ("universite de montreal" finds
-- "Université de Montréal") and let words match in order with gaps
-- ("erasmus rotter" finds "Erasmus University Rotterdam").

create extension if not exists unaccent with schema extensions;

create or replace function public.college_search_text(t text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, t))
$$;

create index if not exists colleges_name_search_trgm_idx
  on public.colleges using gin (public.college_search_text(name) public.gin_trgm_ops);

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
      public.college_search_text(c.name) like '%' || p.words || '%'
      or p.term <% public.college_search_text(c.name)
    )
  order by
    public.college_search_text(c.name) = p.term desc,
    public.college_search_text(c.name) like p.words || '%' desc,
    word_similarity(p.term, public.college_search_text(c.name)) desc,
    similarity(p.term, public.college_search_text(c.name)) desc,
    length(c.name)
  limit least(greatest(coalesce(max_results, 20), 1), 50);
$$;

grant execute on function public.search_colleges(text, integer) to anon, authenticated;
