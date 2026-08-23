import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('active', true)
    .order('created_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cars: data });
}
