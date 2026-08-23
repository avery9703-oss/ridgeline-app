import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function verifyCheckrSignature(rawBody: string, signature: string) {
  const hmac = crypto.createHmac('sha256', process.env.CHECKR_WEBHOOK_SECRET!);
  hmac.update(rawBody);
  return hmac.digest('hex') === signature;
}

export async function POST(req: Request) {
  const signature = req.headers.get('x-checkr-signature') ?? '';
  const rawBody = await req.text();

  if (!verifyCheckrSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const supabase = supabaseAdmin();

  if (event.type === 'report.completed') {
    const report = event.data.object;
    const status = report.status;

    const { data: bgCheck } = await supabase
      .from('background_checks')
      .update({ checkr_report_id: report.id, status, updated_at: new Date().toISOString() })
      .eq('checkr_candidate_id', report.candidate_id)
      .select()
      .single();

    if (bgCheck) {
      await supabase
        .from('reservations')
        .update({ status: status === 'clear' ? 'agreement_pending' : 'verifying' })
        .eq('id', bgCheck.reservation_id);
    }
  }

  return NextResponse.json({ received: true });
}
