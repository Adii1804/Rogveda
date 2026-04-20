-- ============================================================
-- ROGVEDA — Database Schema + Seed Data
-- Run this in Supabase SQL Editor (Project > SQL Editor > New Query)
-- ============================================================

-- 1. HOSPITALS
create table if not exists hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  image_url text,
  accreditation text,
  created_at timestamptz default now()
);

-- 2. DOCTORS
create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references hospitals(id) on delete cascade,
  name text not null,
  experience_years int not null,
  specialty text not null
);

-- 3. PRICING (doctor + room type → price in USD)
create table if not exists pricing (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references doctors(id) on delete cascade,
  hospital_id uuid references hospitals(id) on delete cascade,
  room_type text not null,
  price_usd numeric(10,2) not null
);

-- 4. PATIENTS
create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  wallet_balance numeric(10,2) default 0,
  created_at timestamptz default now()
);

-- 5. BOOKINGS
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id),
  hospital_id uuid references hospitals(id),
  doctor_id uuid references doctors(id),
  room_type text not null,
  price_usd numeric(10,2) not null,
  currency text default 'USD',
  status text default 'Confirmed',
  created_at timestamptz default now()
);

-- 6. VENDOR TASKS (one task per booking)
create table if not exists vendor_tasks (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  task_name text default 'Visa Invite Letter Sent',
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- 7. WALLET TRANSACTIONS
create table if not exists wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id),
  booking_id uuid references bookings(id),
  amount numeric(10,2) not null,
  type text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Hospitals
insert into hospitals (id, name, city, accreditation) values
  ('a1000000-0000-0000-0000-000000000001', 'Apollo Spectra', 'Delhi', 'NABH Accredited'),
  ('a1000000-0000-0000-0000-000000000002', 'Max Saket', 'Delhi', 'JCI & NABH Accredited'),
  ('a1000000-0000-0000-0000-000000000003', 'Fortis Gurgaon', 'Gurgaon', 'NABH Accredited');

-- Doctors
insert into doctors (id, hospital_id, name, experience_years, specialty) values
  ('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Dr. Ramesh Kumar', 16, 'Orthopedic Surgery'),
  ('d1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Dr. Priya Sharma', 12, 'Orthopedic Surgery'),
  ('d1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'Dr. Vikram Singh', 18, 'Orthopedic Surgery'),
  ('d1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'Dr. Anita Desai', 15, 'Orthopedic Surgery'),
  ('d1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'Dr. Mohit Verma', 10, 'Orthopedic Surgery'),
  ('d1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000003', 'Dr. Sunil Mehta', 20, 'Orthopedic Surgery');

-- Pricing — Apollo Spectra
insert into pricing (doctor_id, hospital_id, room_type, price_usd) values
  ('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'General Ward', 3200),
  ('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Semi-Private', 3800),
  ('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Private', 4500),
  ('d1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'General Ward', 3000),
  ('d1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Semi-Private', 3600),
  ('d1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Private', 4200);

-- Pricing — Max Saket
insert into pricing (doctor_id, hospital_id, room_type, price_usd) values
  ('d1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'General Ward', 3500),
  ('d1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'Semi-Private', 4200),
  ('d1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'Private', 5000),
  ('d1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'Suite', 6500),
  ('d1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'General Ward', 3400),
  ('d1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'Semi-Private', 4000),
  ('d1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'Private', 4800),
  ('d1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'Suite', 6200),
  ('d1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'General Ward', 3100),
  ('d1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'Semi-Private', 3700),
  ('d1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'Private', 4400),
  ('d1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'Suite', 5800);

-- Pricing — Fortis Gurgaon
insert into pricing (doctor_id, hospital_id, room_type, price_usd) values
  ('d1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000003', 'Semi-Private', 3900),
  ('d1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000003', 'Private', 4600);

-- Default patient (used for bookings in demo)
insert into patients (id, name, email, wallet_balance) values
  ('c0000001-0000-0000-0000-000000000001', 'John Doe', 'patient@demo.com', 0);
