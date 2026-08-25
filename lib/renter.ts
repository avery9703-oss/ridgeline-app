import { supabaseAdmin } from './supabase/server';

// Confirms the request's Bearer token belongs to a real, logged-in renter
// (any authenticated user — unlike requireAdmin, there's no extra table
// membership check). Used to make sure a renter can only edit their own
// bookings and profile, not anyone else's.
export async function requireRenter(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length);

  const supabase = supabaseAdmin();
  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData?.user) return null;
  return userData.user;
}
