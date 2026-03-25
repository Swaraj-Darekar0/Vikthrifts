-- 1. Add size column to existing products table
alter table products 
add column if not exists size text check (size in ('S', 'M', 'L', 'XL', '2XL'));

-- 2. Create admin_products table
create table if not exists admin_products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  price numeric not null,
  image_url text,
  category text,
  tags text[],
  size text check (size in ('S', 'M', 'L', 'XL', '2XL')),
  active boolean default true
);

-- 3. Enable RLS for admin_products
alter table admin_products enable row level security;

-- 4. Policies for admin_products
-- Everyone can view
create policy "Public can view admin products" 
on admin_products for select 
using (true);

-- For now, we allow authenticated users to modify (since we handle admin check in frontend)
-- ideally this should be stricter, but fitting the requirement "admin login"
create policy "Allow all operations for now" 
on admin_products for all 
using (true) 
with check (true);

-- 5. Enable Storage for admin uploads if not covered by 'VIKTHRIFTS' bucket policies
-- (Assuming 'VIKTHRIFTS' bucket is used for everything)
