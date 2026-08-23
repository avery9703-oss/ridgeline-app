import { supabaseAdmin } from './supabase/server';

export async function requireAdmin(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length);

  const supabase = supabaseAdmin();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return null;

  const { data: adminRow, error: adminError } = await supabase
    .from('admins')
    .select('id')
    .eq('id', userData.user.id)
    .single();

  if (adminError || !adminRow) return null;
  return userData.user;
}
