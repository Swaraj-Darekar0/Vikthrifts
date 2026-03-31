create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  topic text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved'))
);

alter table public.contact_inquiries enable row level security;

create policy "Anyone can create contact inquiries"
on public.contact_inquiries
for insert
to anon, authenticated
with check (true);

create policy "Admins can read contact inquiries"
on public.contact_inquiries
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_settings
    where admin_settings.email = auth.jwt() ->> 'email'
  )
);

create policy "Admins can update contact inquiries"
on public.contact_inquiries
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_settings
    where admin_settings.email = auth.jwt() ->> 'email'
  )
)
with check (
  exists (
    select 1
    from public.admin_settings
    where admin_settings.email = auth.jwt() ->> 'email'
  )
);
