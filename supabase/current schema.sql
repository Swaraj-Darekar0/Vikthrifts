create table public.profiles (
  id uuid not null,
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  full_name text null,
  role text null default 'buyer'::text,
  avatar_url text null,
  website text null,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_role_check check (
    (
      role = any (
        array['buyer'::text, 'seller'::text, 'admin'::text]
      )
    )
  )
) TABLESPACE pg_default;

create table public.products (
  id uuid not null default gen_random_uuid (),
  store_id uuid not null,
  name text not null,
  price numeric not null,
  category text null,
  description text null,
  image_url text null,
  tags text[] null default '{}'::text[],
  created_at timestamp with time zone null default now(),
  size text null,
  constraint products_pkey primary key (id),
  constraint products_store_id_fkey foreign KEY (store_id) references stores (id) on delete CASCADE,
  constraint products_size_check check (
    (
      size = any (
        array[
          'S'::text,
          'M'::text,
          'L'::text,
          'XL'::text,
          '2XL'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;
create table public.stores (
  id uuid not null default gen_random_uuid (),
  owner_id uuid not null,
  name text not null,
  category text null,
  description text null,
  image_url text null,
  initials text null,
  color text null,
  tags text[] null default '{}'::text[],
  created_at timestamp with time zone null default now(),
  constraint stores_pkey primary key (id),
  constraint stores_owner_id_fkey foreign KEY (owner_id) references auth.users (id) on delete CASCADE,
  constraint stores_category_check check (
    (
      category = any (array['clothing'::text, 'accessories'::text])
    )
  )
) TABLESPACE pg_default;

create table public.admin_settings (
  id uuid not null default gen_random_uuid (),
  username text not null,
  password text not null,
  email text not null,
  constraint admin_settings_pkey primary key (id),
  constraint admin_settings_username_key unique (username)
) TABLESPACE pg_default;

create table public.admin_products (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  name text not null,
  description text null,
  price numeric not null,
  image_url text null,
  category text null,
  tags text[] null,
  size text null,
  active boolean null default true,
  constraint admin_products_pkey primary key (id),
  constraint admin_products_category_check check (
    (
      (category is null)
      or (
        category = any (
          array['CLOTHING'::text, 'FOOTWEAR'::text, 'ACCESSORIES'::text]
        )
      )
    )
  ),
  constraint admin_products_size_check check (
    (
      size = any (
        array[
          'S'::text,
          'M'::text,
          'L'::text,
          'XL'::text,
          '2XL'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create table public.store_ratings (
  id uuid not null default gen_random_uuid (),
  store_id uuid not null,
  buyer_id uuid not null,
  rating integer not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint store_ratings_pkey primary key (id),
  constraint store_ratings_store_buyer_unique unique (store_id, buyer_id),
  constraint store_ratings_store_id_fkey foreign KEY (store_id) references stores (id) on delete CASCADE,
  constraint store_ratings_buyer_id_fkey foreign KEY (buyer_id) references auth.users (id) on delete CASCADE,
  constraint store_ratings_rating_check check (((rating >= 1) and (rating <= 5)))
) TABLESPACE pg_default;
