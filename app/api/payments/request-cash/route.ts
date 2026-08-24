import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { reservation_id } = await req.json();
  if (!reservation_id) {
    return NextResponse.json({ error: 'reservation_id is required' }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  const { data: reservation, error: resErr } = await supabase
    .from('reservations')
    .select('price_total')
    .eq('id', reservation_id)
    .single();
  if (resErr) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });

  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .insert({
      reservation_id,
      kind: 'cash',
      amount: reservation.price_total,
      status: 'pending_approval',
    })
    .select()
    .single();
  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

  const { data: updated, error: updErr } = await supabase
    .from('reservations')
    .update({ status: 'cash_pending', updated_at: new Date().toISOString() })
    .eq('id', reservation_id)
    .select()
    .single();
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ payment, reservation: updated }, { status: 201 });
}
