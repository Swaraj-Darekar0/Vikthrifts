-- Ensure tags column exists in both product tables
alter table products add column if not exists tags text[] default '{}';
alter table admin_products add column if not exists tags text[] default '{}';
