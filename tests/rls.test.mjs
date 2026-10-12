import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
await db.exec(`
create role anon;
create role authenticated;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$
select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
`);
const schema = readFileSync(new URL('../supabase/schema.sql', import.meta.url),'utf8').replace('create extension if not exists "pgcrypto";','');
await db.exec(schema);
const business='11111111-1111-1111-1111-111111111111';
const influencer='22222222-2222-2222-2222-222222222222';
const stranger='33333333-3333-3333-3333-333333333333';
for(const [id,role] of [[business,'business'],[influencer,'influencer'],[stranger,'influencer']]) {
 await db.query(`insert into auth.users values ($1,$2,$3::jsonb)`,[id,id+'@example.test',JSON.stringify({role,full_name:'Test '+role})]);
}
async function asUser(id,sql,params=[]) {
 await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${id}',false);`);
 return db.query(sql,params);
}
let offer = (await asUser(business,`insert into public.offers (business_id,title,description) values ($1,'Coffee','Demo offer') returning id`,[business])).rows[0].id;
await assert.rejects(()=>asUser(influencer,`insert into public.offers (business_id,title,description) values ($1,'Imposter','No')`,[influencer]));
await assert.rejects(()=>asUser(influencer,`update public.users set role='business' where id=$1`,[influencer]));
let app=(await asUser(influencer,`insert into public.applications (offer_id,influencer_id,pitch) values ($1,$2,'Sample pitch') returning id`,[offer,influencer])).rows[0].id;
await assert.rejects(()=>asUser(influencer,`insert into public.applications (offer_id,influencer_id) values ($1,$2)`,[offer,influencer]));
assert.equal((await asUser(stranger,`select * from public.applications`)).rows.length,0);
assert.equal((await asUser(stranger,`update public.applications set status='accepted' where id=$1 returning id`,[app])).rows.length,0);
await asUser(business,`update public.applications set status='accepted' where id=$1`,[app]);
assert.equal((await asUser(influencer,`select * from public.deals`)).rows.length,1);
await assert.rejects(()=>asUser(business,`update public.applications set influencer_id=$1 where id=$2`,[stranger,app]));
await assert.rejects(()=>asUser(business,`update public.applications set status='pending' where id=$1`,[app]));
await asUser(business,`update public.applications set status='completed' where id=$1`,[app]);
assert.equal((await asUser(influencer,`select status,completed_at from public.deals`)).rows[0].status,'completed');
await asUser(business,`update public.offers set status='closed' where id=$1`,[offer]);
assert.equal((await asUser(influencer,`select * from public.offers`)).rows.length,0);
await assert.rejects(()=>asUser(stranger,`insert into public.applications (offer_id,influencer_id) values ($1,$2)`,[offer,stranger]));
await assert.rejects(()=>asUser(influencer, `insert into public.business_profiles (user_id,business_name) values ($1,'Imposter')`,[influencer]));
await assert.rejects(()=>asUser(stranger, `insert into public.applications (offer_id,influencer_id,status) values ($1,$2,'accepted')`,[offer,stranger]));
console.log('Passed: schema initialization, signup triggers, business ownership, immutable roles and participant IDs, duplicate applications, private application visibility, status transitions, automatic deals, closed-offer protection.');
await db.close();
