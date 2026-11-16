-- Ranking every substring match by word_similarity cost ~400ms for broad
-- queries ("uni" matches ~7,700 rows). Rank substring matches with cheap
-- expressions first, and only fall back to fuzzy trigram matching (typos)
-- when there aren't enough substring matches.

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
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
declare
  term text := public.college_search_text(btrim(coalesce(q, '')));
  lim integer := least(greatest(coalesce(max_results, 20), 1), 50);
  words text;
  substring_count integer;
  found_ids uuid[];
begin
  if length(term) < 2 then
    return;
  end if;

  words := regexp_replace(
    replace(replace(replace(term, '\', '\\'), '%', '\%'), '_', '\_'),
    '\s+', '%', 'g'
  );

  return query
    select c.id, c.name, c.state, c.country, c.country_code, c.state_province
    from public.colleges c
    where c.search_name like '%' || words || '%'
    order by
      c.search_name = term desc,
      c.search_name like words || '%' desc,
      c.search_name like '% ' || words || '%' desc,
      length(c.name),
      c.name
    limit lim;

  get diagnostics substring_count = row_count;
  if substring_count >= lim then
    return;
  end if;

  select coalesce(array_agg(c.id), '{}') into found_ids
  from public.colleges c
  where c.search_name like '%' || words || '%';

  return query
    select c.id, c.name, c.state, c.country, c.country_code, c.state_province
    from public.colleges c
    where term <% c.search_name
      and c.id <> all (found_ids)
    order by word_similarity(term, c.search_name) desc, length(c.name), c.name
    limit lim - substring_count;
end;
$$;

grant execute on function public.search_colleges(text, integer) to anon, authenticated;
