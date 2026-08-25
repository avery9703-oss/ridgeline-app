-- Adds a preferred-pickup-time field to reservations.
-- Run this once in the Supabase SQL editor on an existing database.
alter table reservations add column if not exists pickup_time time;
