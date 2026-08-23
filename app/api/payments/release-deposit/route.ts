import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { reservation_id } = await req.json();
  const supabase = supabaseAdmin();

  const { data: payment, error } = await supabase
    .from('payments')
    .select('*')
    .eq('reservation_id', reservation_id)
    .eq('kind', 'deposit_hold')
    .single();
  if (error) return NextResponse.json({ error: 'Deposit hold not found' }, { status: 404 });

  await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id);

  await supabase
    .from('payments')
    .update({ status: 'released', updated_at: new Date().toISOString() })
    .eq('id', payment.id);

  return NextResponse.json({ ok: true });
}
