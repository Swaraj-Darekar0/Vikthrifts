create extension if not exists pgcrypto;

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

create policy "Buyers can view their orders"
on public.orders
for select
to authenticated
using (auth.uid() = buyer_id);

create policy "Buyers can create their orders"
on public.orders
for insert
to authenticated
with check (auth.uid() = buyer_id);

create policy "Sellers can view assigned orders"
on public.orders
for select
to authenticated
using (auth.uid() = seller_id);

create policy "Sellers can update assigned orders"
on public.orders
for update
to authenticated
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

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
);

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
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
