select * from public.users where id = auth.uid();

select
  o.id,
  o.title,
  o.description,
  bp.business_name
from public.offers o
left join public.business_profiles bp on bp.user_id = o.business_id
where o.status = 'open'
order by o.created_at desc;

select
  a.id,
  a.status,
  a.created_at,
  ip.display_name
from public.applications a
left join public.influencer_profiles ip on ip.user_id = a.influencer_id
where a.offer_id = 'replace-with-offer-id';
