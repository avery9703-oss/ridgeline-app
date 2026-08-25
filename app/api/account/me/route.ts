import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireRenter } from '@/lib/renter';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const renter = await requireRenter(req);
  if (!renter) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('renters')
    .select('full_name, phone, license_verified, background_check_status')
    .eq('id', renter.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: { ...data, email: renter.email } });
}

export async function PATCH(req: Request) {
  const renter = await requireRenter(req);
  if (!renter) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { full_name, phone } = await req.json();
  const update: Record<string, unknown> = {};
  if (typeof full_name === 'string') update.full_name = full_name;
  if (typeof phone === 'string') update.phone = phone;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('renters')
    .update(update)
    .eq('id', renter.id)
    .select('full_name, phone')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
