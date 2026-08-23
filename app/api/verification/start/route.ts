import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { reservation_id } = await req.json();
  const supabase = supabaseAdmin();

  const session = await stripe.identity.verificationSessions.create({
    type: 'document',
    metadata: { reservation_id },
    options: { document: { require_matching_selfie: true } },
  });

  await supabase.from('identity_verifications').insert({
    reservation_id,
    stripe_verification_session_id: session.id,
    status: 'pending',
  });

  return NextResponse.json({ client_secret: session.client_secret });
}
