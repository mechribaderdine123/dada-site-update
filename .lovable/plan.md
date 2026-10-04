# Secure login + admin approval system

## What changes

### 1. Enable Lovable Cloud (backend)

Required for real authentication, database, and file storage. Replaces the current fake sign-in and the hardcoded admin password (`dada2026`) currently stored in client code — a critical security issue today.

### 2. Real authentication

- Artists sign up / sign in via email + password through Cloud Auth (sessions, hashed passwords, secure tokens — all managed).
- Admin is no longer a hardcoded password. Admin becomes a **role** assigned to specific accounts in the database.
- Sign-up form keeps its 3 steps (info, artistic profile, socials) — data saved to a `profiles` table.

### 3. Database tables

- `profiles` — artist info (name, bio, genre, city, socials, avatar) + `status` ('pending' | 'approved' | 'rejected')
- `user_roles` — separates roles from profiles (secure pattern, no privilege escalation)
- `tracks` — music uploads with `status` ('pending' | 'approved' | 'rejected') + audio file in storage
- `albums` — same approval flow if kept

Row-Level Security policies:

- Artists see/edit only their own profile & tracks
- Public site shows only `approved` profiles and `approved` tracks
- Admins see everything and can change status

### 4. Approval flow

- **New artist signs up** → account created with `status = pending` → sees "En attente de validation" screen instead of the artist dashboard
- **Artist uploads a track** → track saved with `status = pending` → not visible on public pages until approved
- **Admin dashboard** gets two new sections:
  - "Comptes en attente" — list of pending artists with Approve / Reject buttons
  - "Musiques en attente" — list of pending tracks with preview + Approve / Reject buttons

### 5. Public site

- Artist directory / discography pages only show approved content.
- Existing static/editorial pages (home, about, cours, contact, workshops) are unchanged.

## Kept as-is

- Visual design, colors, fonts, page layouts
- Site content editor in admin (localStorage-based text overrides)
- All public marketing pages

## Not included (ask if you want them)

- Email notifications when approved/rejected
- Password reset flow
- Google / social login
- Admin ability to edit artist profiles directly

---

**Confirm and I'll enable Cloud and implement everything above.** Once Cloud is on, the first account you create — tell me the email — I'll grant it the admin role so the old `admin / dada2026` login is fully removed.
