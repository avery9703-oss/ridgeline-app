import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { reservation_id } = await req.json();
  const supabase = supabaseAdmin();

  const { data: reservation, error } = await supabase
    .from('reservations')
    .select('price_total')
    .eq('id', reservation_id)
    .single();
  if (error) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });

  const amount = Math.round(Number(reservation.price_total) * 100);

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    metadata: { reservation_id, kind: 'rental_charge' },
  });

  await supabase.from('payments').insert({
    reservation_id,
    stripe_payment_intent_id: intent.id,
    kind: 'rental_charge',
    amount: amount / 100,
    status: 'pending',
  });

  return NextResponse.json({ client_secret: intent.client_secret });
}
