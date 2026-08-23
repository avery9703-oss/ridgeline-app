import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!;
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET_PAYMENTS!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const { reservation_id, kind } = intent.metadata;

    await supabase
      .from('payments')
      .update({ status: 'succeeded', updated_at: new Date().toISOString() })
      .eq('stripe_payment_intent_id', intent.id);

    if (kind === 'rental_charge' && reservation_id) {
      await supabase
        .from('reservations')
        .update({ status: 'confirmed' })
        .eq('id', reservation_id);
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent;
    await supabase
      .from('payments')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('stripe_payment_intent_id', intent.id);
  }

  return NextResponse.json({ received: true });
}
