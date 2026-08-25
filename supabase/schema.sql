create extension if not exists "pgcrypto";

create table cars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tag text,
  year int,
  price_per_day numeric not null,
  seats int,
  mileage_per_day int default 150,
  plate text,
  description text,
  photo_url text,
  active boolean default true,
  created_at timestamptz default now()
);

create table renters (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  license_verified boolean default false,
  background_check_status text default 'not_started',
  created_at timestamptz default now()
);

create type reservation_status as enum (
  'pending_account','account_created','verifying','agreement_pending',
  'payment_pending','cash_pending','confirmed','cancelled','expired','completed'
);

create table reservations (
  id uuid primary key default gen_random_uuid(),
  confirmation_code text unique not null,
  car_id uuid references cars(id) not null,
  renter_id uuid references renters(id),
  start_date date not null,
  end_date date not null,
  pickup_time time,
  status reservation_status not null default 'pending_account',
  expires_at timestamptz,
  price_total numeric,
  deposit_amount numeric default 500,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_reservations_car_dates on reservations (car_id, start_date, end_date);
create index idx_reservations_status on reservations (status);
create index idx_reservations_renter on reservations (renter_id);

create table consent_records (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations(id) not null,
  renter_id uuid references renters(id),
  consent_text text not null,
  ip_address text,
  signed_at timestamptz default now()
);

create table identity_verifications (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations(id) not null,
  stripe_verification_session_id text,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table background_checks (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations(id) not null,
  checkr_candidate_id text,
  checkr_report_id text,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table agreements (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations(id) not null,
  signer_name text not null,
  ip_address text,
  signed_at timestamptz default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations(id) not null,
  stripe_payment_intent_id text,
  kind text not null,
  amount numeric not null,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table admins (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

alter table reservations enable row level security;
alter table renters enable row level security;
alter table payments enable row level security;
alter table agreements enable row level security;
alter table consent_records enable row level security;
alter table admins enable row level security;

create policy "renters read own row" on renters
  for select using (auth.uid() = id);

create policy "renters read own reservations" on reservations
  for select using (auth.uid() = renter_id);

create policy "admins read own row" on admins
  for select using (auth.uid() = id);
