import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function makeConfirmationCode() {
  const n = Math.floor(100000 + Math.random() * 899999);
  return `RMC-${n}`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { car_id, start_date, end_date } = body;

  if (!car_id || !start_date || !end_date) {
    return NextResponse.json({ error: 'car_id, start_date, and end_date are required' }, { status: 400 });
  }
  if (new Date(start_date) >= new Date(end_date)) {
    return NextResponse.json({ error: 'end_date must be after start_date' }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  const { data: overlaps, error: overlapErr } = await supabase
    .from('reservations')
    .select('id')
    .eq('car_id', car_id)
    .not('status', 'in', '(cancelled,expired,completed)')
    .lte('start_date', end_date)
    .gte('end_date', start_date);

  if (overlapErr) return NextResponse.json({ error: overlapErr.message }, { status: 500 });
  if (overlaps && overlaps.length > 0) {
    return NextResponse.json({ error: 'This car is not available for those dates' }, { status: 409 });
  }

  const { data: car, error: carErr } = await supabase
    .from('cars')
    .select('price_per_day')
    .eq('id', car_id)
    .single();
  if (carErr) return NextResponse.json({ error: 'Car not found' }, { status: 404 });

  const days = Math.ceil((new Date(end_date).getTime() - new Date(start_date).getTime()) / 86400000);
  const price_total = days * Number(car.price_per_day);

  const expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert({
      confirmation_code: makeConfirmationCode(),
      car_id,
      start_date,
      end_date,
      status: 'pending_account',
      expires_at,
      price_total,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reservation }, { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const renter_id = searchParams.get('renter_id');
  if (!renter_id) return NextResponse.json({ error: 'renter_id is required' }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('reservations')
    .select('*, cars(name, tag, photo_url)')
    .eq('renter_id', renter_id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reservations: data });
}
