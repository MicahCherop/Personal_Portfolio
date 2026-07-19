-- ============================================================
-- Joseph Micah Portfolio — Supabase Schema
-- Run this entire file once in your Supabase SQL Editor.
-- Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- ── profile (single row, id = 1 always) ──────────────────────
create table if not exists profile (
  id            integer primary key default 1,
  name          text    not null default 'Joseph Micah',
  eyebrow       text    not null default 'load_profile()',
  headline      text    not null default 'I Turn Messy Data Into Decisions You Can Act On.',
  subhead       text    not null default 'I help businesses automate reports, build live dashboards, and apply machine learning to solve problems hiding in their data.',
  bio           text    not null default 'Hi, I''m Joseph Micah. With a background in data analytics, data science, and front-end development, I''m passionate about finding the story hidden inside data.',
  photo_url     text    not null default 'Cherop.png',
  resume_url    text    not null default '',
  email         text    not null default 'mic1dev.me@gmail.com',
  whatsapp      text    not null default 'https://wa.me/254729672192',
  calendly      text    not null default '',
  linkedin      text    not null default 'https://www.linkedin.com/in/micah-joseph-997cc',
  github        text    not null default 'https://github.com/MicahCherop',
  stat1         text    not null default '40+ hrs',
  stat1_label   text    not null default 'saved monthly',
  stat2         text    not null default '4+',
  stat2_label   text    not null default 'BI tools',
  stat3         text    not null default '100%',
  stat3_label   text    not null default 'remote-ready',
  constraint    single_row check (id = 1)
);

-- seed the one profile row (safe to run again)
insert into profile (id) values (1) on conflict (id) do nothing;

-- ── projects ─────────────────────────────────────────────────
create table if not exists projects (
  id         uuid    primary key default gen_random_uuid(),
  title      text    not null,
  problem    text    not null default '',
  solution   text    not null default '',
  result     text    not null default '',
  tags       text[]  not null default '{}',
  link       text    not null default '',
  image_url  text    not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ── experience ───────────────────────────────────────────────
create table if not exists experience (
  id         uuid    primary key default gen_random_uuid(),
  role       text    not null,
  org        text    not null default '',
  period     text    not null default '',
  points     text[]  not null default '{}',
  sort_order integer not null default 0
);

-- ── education ────────────────────────────────────────────────
create table if not exists education (
  id         uuid    primary key default gen_random_uuid(),
  degree     text    not null,
  org        text    not null default '',
  period     text    not null default '',
  sort_order integer not null default 0
);

-- ── skills ───────────────────────────────────────────────────
create table if not exists skills (
  id         uuid    primary key default gen_random_uuid(),
  category   text    not null,
  items      text[]  not null default '{}',
  sort_order integer not null default 0
);

-- ── testimonials ─────────────────────────────────────────────
create table if not exists testimonials (
  id         uuid    primary key default gen_random_uuid(),
  quote      text    not null,
  name       text    not null default '',
  role       text    not null default '',
  sort_order integer not null default 0
);

-- ── Row Level Security ────────────────────────────────────────
-- Public read on everything (portfolio is public)
alter table profile      enable row level security;
alter table projects     enable row level security;
alter table experience   enable row level security;
alter table education    enable row level security;
alter table skills       enable row level security;
alter table testimonials enable row level security;

-- Anyone can SELECT (anon key used on the public site)
create policy "public read profile"      on profile      for select using (true);
create policy "public read projects"     on projects     for select using (true);
create policy "public read experience"   on experience   for select using (true);
create policy "public read education"    on education    for select using (true);
create policy "public read skills"       on skills       for select using (true);
create policy "public read testimonials" on testimonials for select using (true);

-- Only authenticated users (admin) can write
create policy "auth write profile"      on profile      for all    using (auth.role() = 'authenticated');
create policy "auth write projects"     on projects     for all    using (auth.role() = 'authenticated');
create policy "auth write experience"   on experience   for all    using (auth.role() = 'authenticated');
create policy "auth write education"    on education    for all    using (auth.role() = 'authenticated');
create policy "auth write skills"       on skills       for all    using (auth.role() = 'authenticated');
create policy "auth write testimonials" on testimonials for all    using (auth.role() = 'authenticated');


-- ── Storage Buckets & RLS ─────────────────────────────────────
-- Create the buckets for your file uploads
insert into storage.buckets (id, name, public) values 
  ('photos', 'photos', true),
  ('resumes', 'resumes', true),
  ('project-images', 'project-images', true)
on conflict do nothing;

-- Ensure anyone can view the images/PDFs
create policy "Public Storage Read" on storage.objects for select using (bucket_id in ('photos', 'resumes', 'project-images'));

-- Ensure only you (the admin) can upload, update, or delete files
create policy "Admin Storage Insert" on storage.objects for insert with check (auth.role() = 'authenticated');
create policy "Admin Storage Update" on storage.objects for update using (auth.role() = 'authenticated');
create policy "Admin Storage Delete" on storage.objects for delete using (auth.role() = 'authenticated');


-- ── Seed starter data ─────────────────────────────────────────
insert into projects (title, problem, solution, result, tags, sort_order) values
  (
    'Automated Sales Reporting in Google Sheets',
    'Client spent 10+ hours weekly compiling sales data by hand.',
    'Built a Python script against the Sheets API to auto-pull and clean data daily.',
    'Saved 40+ hours a month and eliminated reporting errors.',
    array['Python','Automation','Google Sheets API'],
    0
  ),
  (
    'Live Inventory Dashboard in Power BI',
    'No real-time visibility into stock caused frequent stockouts.',
    'Connected the SQL database to Power BI for a live dashboard with low-stock alerts.',
    'Cut stockouts by 40% and improved inventory turnover.',
    array['Power BI','SQL','Data Visualization'],
    1
  )
on conflict do nothing;

insert into experience (role, org, period, points, sort_order) values
  (
    'Freelance Data Scientist',
    'Self-employed',
    '2023 — present',
    array[
      'Deliver automation, dashboards, and ML projects for small and mid-size businesses.',
      'Manage projects end-to-end: scoping, build, handover, and support.'
    ],
    0
  )
on conflict do nothing;

insert into education (degree, org, period, sort_order) values
  ('B.Sc. in a relevant field', 'Your University', '20XX — 20XX', 0)
on conflict do nothing;

insert into skills (category, items, sort_order) values
  ('Languages & querying', array['Python','SQL','DAX'],          0),
  ('BI & visualization',   array['Power BI','Looker Studio','Excel'], 1),
  ('Machine learning',     array['scikit-learn','Forecasting','Pandas'], 2)
on conflict do nothing;