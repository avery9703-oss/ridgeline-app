import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { reservation_id, signer_name } = await req.json();
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';

  const supabase = supabaseAdmin();
  const { error } = await supabase.from('agreements').insert({
    reservation_id,
    signer_name,
    ip_address: ip,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from('reservations')
    .update({ status: 'payment_pending' })
    .eq('id', reservation_id);

  return NextResponse.json({ ok: true });
}
