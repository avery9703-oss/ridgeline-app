import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { reservation_id, full_name, email, redirect_uri } = await req.json();
  const supabase = supabaseAdmin();

  const checkrRes = await fetch('https://api.checkr.com/v1/candidates', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(process.env.CHECKR_API_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ full_name, email }),
  });
  const candidate = await checkrRes.json();

  const inviteRes = await fetch('https://api.checkr.com/v1/invitations', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(process.env.CHECKR_API_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      candidate_id: candidate.id,
      package: 'driver_mvr',
      ...(redirect_uri ? { redirect_uri } : {}),
    }),
  });
  const invitation = await inviteRes.json();

  await supabase.from('background_checks').insert({
    reservation_id,
    checkr_candidate_id: candidate.id,
    status: 'pending',
  });

  return NextResponse.json({ invitation_url: invitation.invitation_url });
}
