-- Run this in Supabase SQL Editor after supabase-setup.sql.
-- It restricts write access to the single admin email below.

drop policy if exists "auth write profile" on profile;
drop policy if exists "auth write projects" on projects;
drop policy if exists "auth write experience" on experience;
drop policy if exists "auth write education" on education;
drop policy if exists "auth write skills" on skills;
drop policy if exists "auth write testimonials" on testimonials;

create policy "owner write profile" on profile
  for all using (auth.jwt() ->> 'email' = 'mic1dev.me@gmail.com')
  with check (auth.jwt() ->> 'email' = 'mic1dev.me@gmail.com');

create policy "owner write projects" on projects
  for all using (auth.jwt() ->> 'email' = 'mic1dev.me@gmail.com')
  with check (auth.jwt() ->> 'email' = 'mic1dev.me@gmail.com');

create policy "owner write experience" on experience
  for all using (auth.jwt() ->> 'email' = 'mic1dev.me@gmail.com')
  with check (auth.jwt() ->> 'email' = 'mic1dev.me@gmail.com');

create policy "owner write education" on education
  for all using (auth.jwt() ->> 'email' = 'mic1dev.me@gmail.com')
  with check (auth.jwt() ->> 'email' = 'mic1dev.me@gmail.com');

create policy "owner write skills" on skills
  for all using (auth.jwt() ->> 'email' = 'mic1dev.me@gmail.com')
  with check (auth.jwt() ->> 'email' = 'mic1dev.me@gmail.com');

create policy "owner write testimonials" on testimonials
  for all using (auth.jwt() ->> 'email' = 'mic1dev.me@gmail.com')
  with check (auth.jwt() ->> 'email' = 'mic1dev.me@gmail.com');

drop policy if exists "Admin Storage Insert" on storage.objects;
drop policy if exists "Admin Storage Update" on storage.objects;
drop policy if exists "Admin Storage Delete" on storage.objects;

create policy "Owner Storage Insert" on storage.objects
  for insert with check (auth.jwt() ->> 'email' = 'mic1dev.me@gmail.com');

create policy "Owner Storage Update" on storage.objects
  for update using (auth.jwt() ->> 'email' = 'mic1dev.me@gmail.com')
  with check (auth.jwt() ->> 'email' = 'mic1dev.me@gmail.com');

create policy "Owner Storage Delete" on storage.objects
  for delete using (auth.jwt() ->> 'email' = 'mic1dev.me@gmail.com');
