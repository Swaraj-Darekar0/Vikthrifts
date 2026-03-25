create extension if not exists pgcrypto;

-- ==========================================
-- 1. ENHANCE EXISTING TABLES
-- ==========================================

-- Add size and tags to the products table
alter table public.products 
add column if not exists size text check (size in ('S', 'M', 'L', 'XL', '2XL')),
add column if not exists tags text[] default '{}';

alter table public.stores
add column if not exists category text check (category in ('clothing', 'accessories'));

alter table public.admin_products
drop constraint if exists admin_products_category_check;

alter table public.admin_products
add constraint admin_products_category_check
check (category is null or category in ('CLOTHING', 'FOOTWEAR', 'ACCESSORIES'));

-- ==========================================
-- 2. CREATE ADMIN PRODUCTS TABLE
-- ==========================================

create table if not exists public.admin_products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  price numeric not null,
  image_url text,
  category text,
  tags text[] default '{}',
  size text check (size in ('S', 'M', 'L', 'XL', '2XL')),
  active boolean default true
);

-- Enable RLS
alter table public.admin_products enable row level security;

-- Policies
create policy "Public can view admin products" on public.admin_products for select using (true);
create policy "Authenticated users can manage admin products" on public.admin_products for all to authenticated using (true);

-- ==========================================
-- 3. CREATE ADMIN SETTINGS TABLE
-- ==========================================

create table if not exists public.admin_settings (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password text not null,
  email text not null -- This links to the Supabase Auth Email
);

-- Enable RLS (Strict)
alter table public.admin_settings enable row level security;
create policy "Admins can view settings" on public.admin_settings for select using (true); -- Required for the AdminAuth check

-- INSERT INITIAL ADMIN CREDENTIALS
insert into public.admin_settings (username, password, email)
values
  ('swarajdarekar', 'swaraj', 'admin@VIKTHRIFTS.com'),
  ('vickybarawal', 'vicky', 'vickybarawal@VIKTHRIFTS.com')
on conflict (username) do update 
set password = excluded.password, email = excluded.email;

-- ==========================================
-- 3B. STORE RATINGS
-- ==========================================

create table if not exists public.store_ratings (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint store_ratings_store_buyer_unique unique (store_id, buyer_id)
);

alter table public.store_ratings enable row level security;

drop policy if exists "Public can view store ratings" on public.store_ratings;
create policy "Public can view store ratings" on public.store_ratings for select using (true);
drop policy if exists "Authenticated users can rate stores" on public.store_ratings;
create policy "Authenticated users can rate stores" on public.store_ratings
for insert
to authenticated
with check (auth.uid() = buyer_id);
drop policy if exists "Users can update their own store ratings" on public.store_ratings;
create policy "Users can update their own store ratings" on public.store_ratings
for update
to authenticated
using (auth.uid() = buyer_id)
with check (auth.uid() = buyer_id);

-- ==========================================
-- 4. STORAGE SETUP (thredz BUCKET)
-- ==========================================

-- Create the bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('thredz', 'thredz', true)
on conflict (id) do nothing;

-- Storage Policies
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access" on storage.objects for select using ( bucket_id = 'thredz' );
drop policy if exists "Authenticated users can upload" on storage.objects;
create policy "Authenticated users can upload" on storage.objects for insert to authenticated with check ( bucket_id = 'thredz' );
drop policy if exists "Users can update own files" on storage.objects;
create policy "Users can update own files" on storage.objects for update to authenticated using ( bucket_id = 'thredz' );
drop policy if exists "Users can delete own files" on storage.objects;
create policy "Users can delete own files" on storage.objects for delete to authenticated using ( bucket_id = 'thredz' );

-- ==========================================
-- 5. PROFILE ROLE EXTENSION
-- ==========================================

-- Allow 'admin' role in the profiles table
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('buyer', 'seller', 'admin'));

-- ==========================================
-- 5B. STORE + PRODUCT ACCESS POLICIES
-- ==========================================

alter table if exists public.stores enable row level security;
alter table if exists public.products enable row level security;

drop policy if exists "Public can view stores" on public.stores;
create policy "Public can view stores"
on public.stores
for select
using (true);

drop policy if exists "Authenticated sellers can create stores" on public.stores;
create policy "Authenticated sellers can create stores"
on public.stores
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "Store owners can update stores" on public.stores;
create policy "Store owners can update stores"
on public.stores
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Public can view products" on public.products;
create policy "Public can view products"
on public.products
for select
using (true);

drop policy if exists "Store owners can create products" on public.products;
create policy "Store owners can create products"
on public.products
for insert
to authenticated
with check (
  exists (
    select 1
    from public.stores
    where stores.id = products.store_id
      and stores.owner_id = auth.uid()
  )
);

drop policy if exists "Store owners can update products" on public.products;
create policy "Store owners can update products"
on public.products
for update
to authenticated
using (
  exists (
    select 1
    from public.stores
    where stores.id = products.store_id
      and stores.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.stores
    where stores.id = products.store_id
      and stores.owner_id = auth.uid()
  )
);

drop policy if exists "Store owners can delete products" on public.products;
create policy "Store owners can delete products"
on public.products
for delete
to authenticated
using (
  exists (
    select 1
    from public.stores
    where stores.id = products.store_id
      and stores.owner_id = auth.uid()
  )
);

drop policy if exists "Admins can update stores" on public.stores;
create policy "Admins can update stores"
on public.stores
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can delete stores" on public.stores;
create policy "Admins can delete stores"
on public.stores
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
on public.products
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
on public.products
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

-- ==========================================
-- 6. ORDERS TABLE
-- ==========================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  order_group_id uuid not null default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  admin_product_id uuid references public.admin_products(id) on delete set null,
  product_name text not null,
  product_image_url text,
  product_price numeric not null check (product_price >= 0),
  product_size text,
  store_id uuid references public.stores(id) on delete set null,
  store_name text not null,
  seller_id uuid references auth.users(id) on delete set null,
  is_admin_order boolean not null default false,
  receiver_name text not null,
  receiver_address text not null,
  receiver_contact_number text not null,
  receiver_pincode text not null,
  payment_method text not null default 'Cash on Delivery',
  return_policy text not null default 'No Returns',
  status text not null default 'pending' check (status in ('pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled')),
  tracking_id text,
  tracking_website text
);

create index if not exists orders_buyer_id_idx on public.orders(buyer_id);
create index if not exists orders_seller_id_idx on public.orders(seller_id);
create index if not exists orders_store_id_idx on public.orders(store_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

alter table public.orders enable row level security;

drop policy if exists "Buyers can view their orders" on public.orders;
create policy "Buyers can view their orders"
on public.orders
for select
to authenticated
using (auth.uid() = buyer_id);

drop policy if exists "Buyers can create their orders" on public.orders;
create policy "Buyers can create their orders"
on public.orders
for insert
to authenticated
with check (auth.uid() = buyer_id);

drop policy if exists "Sellers can view assigned orders" on public.orders;
create policy "Sellers can view assigned orders"
on public.orders
for select
to authenticated
using (auth.uid() = seller_id);

drop policy if exists "Sellers can update assigned orders" on public.orders;
create policy "Sellers can update assigned orders"
on public.orders
for update
to authenticated
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

drop policy if exists "Admins can view all orders" on public.orders;
create policy "Admins can view all orders"
on public.orders
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
  and is_admin_order = true
);

drop policy if exists "Admins can update all orders" on public.orders;
create policy "Admins can update all orders"
on public.orders
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
  and is_admin_order = true
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
  and is_admin_order = true
);
