import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await req.json();
  if (action !== 'approve' && action !== 'deny') {
    return NextResponse.json({ error: "action must be 'approve' or 'deny'" }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .update({
      status: action === 'approve' ? 'approved' : 'denied',
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single();
  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

  const { data: reservation, error: resErr } = await supabase
    .from('reservations')
    .update({
      status: action === 'approve' ? 'confirmed' : 'payment_pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.reservation_id)
    .select()
    .single();
  if (resErr) return NextResponse.json({ error: resErr.message }, { status: 500 });

  return NextResponse.json({ payment, reservation });
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ error: 'Use /api/admin/payments (list) instead' }, { status: 404 });
}
