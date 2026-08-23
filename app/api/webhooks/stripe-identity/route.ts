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
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET_IDENTITY!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  if (event.type === 'identity.verification_session.verified') {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const reservation_id = session.metadata?.reservation_id;

    await supabase
      .from('identity_verifications')
      .update({ status: 'verified', updated_at: new Date().toISOString() })
      .eq('stripe_verification_session_id', session.id);

    if (reservation_id) {
      await supabase
        .from('reservations')
        .update({ status: 'verifying' })
        .eq('id', reservation_id);
    }
  }

  if (event.type === 'identity.verification_session.requires_input') {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    await supabase
      .from('identity_verifications')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('stripe_verification_session_id', session.id);
  }

  return NextResponse.json({ received: true });
}
