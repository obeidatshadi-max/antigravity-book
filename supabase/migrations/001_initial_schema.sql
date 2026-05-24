-- leads
create table public.leads (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  name text,
  source text,
  created_at timestamptz default now()
);

-- contacts
create table public.contacts (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  message text not null,
  read bool default false,
  created_at timestamptz default now()
);

-- reviews
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  author text not null,
  role text,
  quote text not null,
  display_order int default 0,
  published bool default true
);

-- blog_posts
create table public.blog_posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  body text not null,
  published bool default false,
  published_at timestamptz
);

-- dialogues
create table public.dialogues (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  display_order int default 0,
  published bool default true
);

-- page_content (key-value store for editable text)
create table public.page_content (
  key text primary key,
  value text not null,
  section text
);

-- Enable RLS on all tables
alter table public.leads enable row level security;
alter table public.contacts enable row level security;
alter table public.reviews enable row level security;
alter table public.blog_posts enable row level security;
alter table public.dialogues enable row level security;
alter table public.page_content enable row level security;

-- RLS policies
create policy "anon insert leads" on public.leads for insert to anon with check (true);
create policy "auth all leads" on public.leads for all to authenticated using (true) with check (true);
create policy "anon insert contacts" on public.contacts for insert to anon with check (true);
create policy "auth all contacts" on public.contacts for all to authenticated using (true) with check (true);
create policy "anon select reviews" on public.reviews for select to anon using (published = true);
create policy "auth all reviews" on public.reviews for all to authenticated using (true) with check (true);
create policy "anon select posts" on public.blog_posts for select to anon using (published = true);
create policy "auth all posts" on public.blog_posts for all to authenticated using (true) with check (true);
create policy "anon select dialogues" on public.dialogues for select to anon using (published = true);
create policy "auth all dialogues" on public.dialogues for all to authenticated using (true) with check (true);
create policy "anon select page content" on public.page_content for select to anon using (true);
create policy "auth all page content" on public.page_content for all to authenticated using (true) with check (true);
