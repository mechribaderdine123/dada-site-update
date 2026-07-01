## Goal
Replace the existing artist demo with a full clone of dadahiphop.com — same page structure, French copy, and hip-hop academy aesthetic. Original placeholder images (no hotlinking).

## Pages to build

1. **`/` — Home**
   - Hero (full-bleed dark image + "DADA HIP HOP ACADEMY" / "Danse. Culture. Création." / tagline + CTAs "Découvrir nos cours" / "Se connecter artiste")
   - "Nos Partenaires" — auto-scrolling sponsor logo marquee (13 generated logo tiles)

2. **`/cours-activites` — Nos Cours & Activités**
   - Header banner + intro + "Contactez Nous" CTA
   - Grid of 6 categories with bulleted class lists (Cours spécial femmes, Mixte, Danse, Bac Sport, Gym Kids, Martial Arts)
   - "Plan" section with generated facility floor-plan image

3. **`/a-propos` — Qui sommes-nous ?**
   - Founder story (Ghada Belgacem)
   - Mission / Vision / Valeurs cards

4. **`/contact`**
   - Intro + Facebook + Instagram cards
   - Email / Téléphone / Adresse info (contact.dadahiphop@gmail.com, 97 800 464, Tunis)

5. **`/sign-in` — Bienvenue de retour**
   - Split-screen with generated background, logo, email + password form, link to `/sign-up` and `/dada-reseaux-artist`

6. **`/sign-up` — Créer un compte** (mirrors sign-in with name/email/password fields)

7. **`/dada-reseaux-artist`** — keep existing artist profile flow (already built: `/artist`, `/artist/edit`, `/artist/music`, `/artist/discography`, `/artist/album/$id`). Rewire top-level entry link.

## Shared shell
- **Header**: transparent-over-hero nav — Logo left, links (Accueil, À propos, Cours & Activités, Contact) center, "Se connecter" button right. Mobile hamburger.
- **Footer**: brand blurb, quick links, social icons, contact line, copyright.
- Applied via `__root.tsx` `<Outlet />` wrapper.

## Design system
- Dark theme: near-black background, off-white text, bold red/orange accent (hip-hop energy).
- Bebas Neue display + Poppins body (already set up).
- Framer-motion for hero fade-in and sponsor marquee.

## Assets to generate (imagegen fast tier)
- `hero-home.jpg` — dancers silhouette, dark cinematic
- `about-founder.jpg` — dance studio portrait vibe
- `cours-hero.jpg` — dance class action shot
- `signin-bg.jpg` — moody urban dance
- `logo-white.png` — "DADA HIP HOP ACADEMY" wordmark, transparent
- `plan-facility.jpg` — architectural floor plan illustration
- `sponsor-1..8.png` — abstract brand-mark tiles, transparent

## Out of scope for this pass
- Real authentication backend (sign-in form is UI-only; wiring to Lovable Cloud can be a follow-up).
- Course booking / payments.
- CMS for editing content.

Confirm and I'll build it in one pass.