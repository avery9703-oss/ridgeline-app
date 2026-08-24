-- Adds a status for reservations awaiting admin approval of a cash payment.
-- Run this once in the Supabase SQL editor on an existing database.
-- (Postgres requires enum additions to run as their own standalone statement.)
alter type reservation_status add value if not exists 'cash_pending';
