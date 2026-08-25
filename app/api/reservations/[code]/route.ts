import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireRenter } from '@/lib/renter';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('reservations')
    .select('*, cars(name, tag, price_per_day, photo_url)')
    .eq('confirmation_code', params.code)
    .single();

  if (error) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  return NextResponse.json({ reservation: data });
}

// Renters can edit their own reservation's dates/pickup time, or cancel it —
// nothing else. Admins have a separate, more permissive route
// (/api/admin/reservations/[id]) for status management.
const EDITABLE_FIELDS = ['start_date', 'end_date', 'pickup_time'] as const;
const LOCKED_STATUSES = ['confirmed', 'completed', 'cancelled', 'expired'];

export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  const renter = await requireRenter(req);
  if (!renter) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const supabase = supabaseAdmin();

  const { data: existing, error: fetchErr } = await supabase
    .from('reservations')
    .select('*')
    .eq('confirmation_code', params.code)
    .single();
  if (fetchErr || !existing) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });

  if (existing.renter_id !== renter.id) {
    return NextResponse.json({ error: 'This reservation belongs to a different account' }, { status: 403 });
  }

  const wantsCancel = body.status === 'cancelled';
  const update: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) update[field] = body[field];
  }

  const changingDates = 'start_date' in update || 'end_date' in update;

  if (changingDates && LOCKED_STATUSES.includes(existing.status)) {
    return NextResponse.json(
      { error: `Can't change dates on a reservation that's already ${existing.status}` },
      { status: 409 }
    );
  }
  if (wantsCancel && existing.status === 'completed') {
    return NextResponse.json({ error: "Can't cancel a completed reservation" }, { status: 409 });
  }

  if (changingDates) {
    const start = (update.start_date as string) || existing.start_date;
    const end = (update.end_date as string) || existing.end_date;
    if (new Date(start) >= new Date(end)) {
      return NextResponse.json({ error: 'end_date must be after start_date' }, { status: 400 });
    }

    const { data: overlaps, error: overlapErr } = await supabase
      .from('reservations')
      .select('id')
      .eq('car_id', existing.car_id)
      .neq('id', existing.id)
      .not('status', 'in', '(cancelled,expired,completed)')
      .lte('start_date', end)
      .gte('end_date', start);
    if (overlapErr) return NextResponse.json({ error: overlapErr.message }, { status: 500 });
    if (overlaps && overlaps.length > 0) {
      return NextResponse.json({ error: 'This car is not available for those new dates' }, { status: 409 });
    }

    const { data: car, error: carErr } = await supabase
      .from('cars')
      .select('price_per_day')
      .eq('id', existing.car_id)
      .single();
    if (carErr) return NextResponse.json({ error: 'Car not found' }, { status: 404 });

    const days = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
    update.price_total = days * Number(car.price_per_day);
  }

  if (wantsCancel) update.status = 'cancelled';

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('reservations')
    .update(update)
    .eq('confirmation_code', params.code)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reservation: data });
}
