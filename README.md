# Ridgeline Motor Club — backend + frontend

Next.js (App Router) API routes + Supabase (Postgres/Auth) + Stripe
(payments + Identity) + Checkr (driving record checks).

**→ For getting this live with a working booking + payment + verification
flow, see [DEPLOYMENT.md](./DEPLOYMENT.md).** The steps below are for
local development only.

This project has working reservations, admin auth, payments (Stripe), and
identity/background verification (Stripe Identity + Checkr) end to end —
see "What's stubbed vs. real" below for the remaining gap (email
confirmations aren't sent yet).

## 1. Set up Supabase
1. Create a project at supabase.com
2. In the SQL editor, run `supabase/schema.sql`
3. Copy your Project URL, anon key, and service role key into `.env.local`
   (copy `.env.example` as a starting point)

## 2. Set up Stripe
1. Enable **Stripe Identity** in the Stripe dashboard (separate opt-in from
   regular payments)
2. Create two webhook endpoints once deployed:
   - `/api/webhooks/stripe-payments` — listen for `payment_intent.succeeded`,
     `payment_intent.payment_failed`
   - `/api/webhooks/stripe-identity` — listen for
     `identity.verification_session.verified`,
     `identity.verification_session.requires_input`
3. Copy the secret keys and both webhook signing secrets into `.env.local`

## 3. Set up Checkr
1. Sign up for a Checkr account (sandbox mode is fine for development)
2. Create a webhook pointed at `/api/webhooks/checkr`, subscribed to
   `report.completed`
3. Copy the API key and webhook secret into `.env.local`

## 4. Install and run
```
npm install
npm run dev
```

## 5. Seed cars
Run `supabase/seed.sql` in the Supabase SQL editor — it inserts the 3 demo
cars with fixed IDs so `/api/cars` returns something immediately.

## 6. Create an admin user
The `/api/admin/*` routes require a Supabase Auth user who also has a row
in the `admins` table:
1. Create a user (Supabase dashboard → Authentication → Add user, or via
   the `/api/auth/signup` route)
2. Copy their `id` (the auth UID)
3. Run in the SQL editor: `insert into admins (id) values ('paste-uid-here');`
4. Sign in from the site's Admin tab (email/password)

## 7. Run the frontend against this backend
`public/index.html` is the renter-facing site, wired to call these routes:
```
npm run dev
# then visit http://localhost:3000/index.html
```
Fill in the `CONFIG` object near the top of `public/index.html`'s
`<script>` block with your real `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`STRIPE_PUBLISHABLE_KEY`.

If a call to the backend fails (wrong keys, route not deployed yet, etc.)
every step falls back to a simulated/local version so the demo flow still
completes — check the browser console for warnings when something didn't
actually reach the server.

## What's stubbed vs. real
- **Database writes, schema, RLS**: real, ready to use as-is
- **Stripe payment/identity calls**: real API calls — will work once keys are set
- **Checkr calls**: real API calls — will work once keys are set
- **Admin auth**: implemented — Bearer-token check against the `admins` table (see `lib/admin.ts`)
- **Frontend wiring**: `public/index.html` calls the real endpoints for
  reservations, signup, consent, background-check kickoff, agreement
  signing, and payment (via Stripe Elements, both rental charge and
  deposit hold). Identity verification opens Stripe's real
  `verifyIdentity()` modal; the background check opens Checkr's hosted
  invitation page in a new tab and can redirect the renter back via
  `redirect_uri`. Both still rely on their webhooks
  (`/api/webhooks/stripe-identity`, `/api/webhooks/checkr`) to learn the
  actual approved/clear result.
- **Email confirmations**: not built — `resend` is in package.json as a
  starting point, but no route sends anything yet
