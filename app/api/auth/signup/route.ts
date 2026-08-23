import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { email, password, full_name, phone, reservation_code } = await req.json();
  const supabase = supabaseAdmin();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  const renter_id = authData.user.id;

  const { error: renterErr } = await supabase
    .from('renters')
    .insert({ id: renter_id, full_name, phone });
  if (renterErr) return NextResponse.json({ error: renterErr.message }, { status: 500 });

  if (reservation_code) {
    await supabase
      .from('reservations')
      .update({ renter_id, status: 'account_created' })
      .eq('confirmation_code', reservation_code);
  }

  return NextResponse.json({ renter_id }, { status: 201 });
}
