import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

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

export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  const body = await req.json();
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from('reservations')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('confirmation_code', params.code)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reservation: data });
}
