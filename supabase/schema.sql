-- 1. Create a table for public profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  full_name text,
  role text default 'buyer' check (role in ('buyer', 'seller')),
  avatar_url text,
  website text
);

-- 2. Set up Row Level Security (RLS)
alter table profiles enable row level security;

-- Policy: Everyone can view profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

-- Policy: Users can insert their own profile (fallback if trigger fails)
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

-- Policy: Users can update their own profile
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 3. Function to automatically handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role');
  return new;
end;
$$;

-- 4. Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Create the storage bucket for images
insert into storage.buckets (id, name, public)
values ('VIKTHRIFTS', 'VIKTHRIFTS', true)
on conflict (id) do nothing;

-- 6. Storage Policies
-- Allow public to view images
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'VIKTHRIFTS' );

-- Allow authenticated users to upload images
create policy "Authenticated users can upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'VIKTHRIFTS' );

-- Allow users to update/delete their own images
create policy "Users can update their own images"
on storage.objects for update
to authenticated
using ( bucket_id = 'VIKTHRIFTS' AND (auth.uid() = owner) );

create policy "Users can delete their own images"
on storage.objects for delete
to authenticated
using ( bucket_id = 'VIKTHRIFTS' AND (auth.uid() = owner) );
