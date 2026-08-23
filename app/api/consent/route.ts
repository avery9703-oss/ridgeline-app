import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const CONSENT_TEXT =
  'I authorize Ridgeline Motor Club to obtain a consumer report including my driving record, ' +
  'for the purpose of this rental. I understand I can request a copy of any report used.';

export async function POST(req: Request) {
  const { reservation_id, renter_id } = await req.json();
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';

  const supabase = supabaseAdmin();
  const { error } = await supabase.from('consent_records').insert({
    reservation_id,
    renter_id,
    consent_text: CONSENT_TEXT,
    ip_address: ip,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
