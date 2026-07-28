// Central registry of editable content across all pages.
// Each field has: key, label, type (text | textarea | image), default value.

export type FieldType = "text" | "textarea" | "image";

export interface EditableField {
  key: string;
  label: string;
  type: FieldType;
  default: string;
}

export interface PageSchema {
  id: string;
  label: string;
  path: string;
  fields: EditableField[];
}

import heroImage from "@/assets/dada-hero.jpg";
import welcomeImage from "@/assets/hero-dancers.jpg";
import teamImage from "@/assets/dada-founder.jpg";
import dancersImage from "@/assets/dada-cours.jpg";
import coursHero from "@/assets/dada-cours.jpg";
import coursPlan from "@/assets/dada-plan.jpg";

export const PAGE_SCHEMAS: PageSchema[] = [
  {
    id: "home",
    label: "Accueil",
    path: "/",
    fields: [
      { key: "home.hero.image", label: "Image hero", type: "image", default: heroImage },
      { key: "home.hero.title1", label: "Titre ligne 1", type: "text", default: "DADA HIP HOP" },
      { key: "home.hero.title2", label: "Titre ligne 2", type: "text", default: "ACADEMY" },
      { key: "home.hero.subtitle", label: "Sous-titre", type: "text", default: "Danse. Culture. Création." },
      { key: "home.hero.tagline", label: "Slogan", type: "text", default: "L'espace où chaque talent trouve son expression." },
      { key: "home.hero.cta1", label: "Bouton 1", type: "text", default: "Découvrir nos cours" },
      { key: "home.hero.cta2", label: "Bouton 2", type: "text", default: "Sign in artist" },
      { key: "home.welcome.p1", label: "Bienvenue - paragraphe 1", type: "textarea", default: "Bienvenue à Dada Hip Hop Academy, un lieu unique dédié à la danse, au mouvement, au bien-être et à la création artistique." },
      { key: "home.welcome.p2", label: "Bienvenue - paragraphe 2", type: "textarea", default: "Nous réunissons cours, clubs, studio musique, ateliers créatifs et espace digital pour offrir à chacun un véritable terrain d'expression." },
      { key: "home.welcome.p3", label: "Bienvenue - paragraphe 3", type: "textarea", default: "Rejoignez une communauté dynamique, artistique et passionnée." },
      { key: "home.welcome.motto", label: "Devise", type: "text", default: "Bougez. Créez. Exprimez-vous" },
      { key: "home.card1.title", label: "Carte 1 - titre", type: "text", default: "Rejoindre un club" },
      { key: "home.card1.body", label: "Carte 1 - texte", type: "textarea", default: "Explorez nos styles de danse et trouvez votre rythme." },
      { key: "home.card2.title", label: "Carte 2 - titre", type: "text", default: "Réserver au studio musique" },
      { key: "home.card2.body", label: "Carte 2 - texte", type: "textarea", default: "Un studio musique pro pour enregistrer vos sons." },
      { key: "home.welcome.image", label: "Image bienvenue", type: "image", default: welcomeImage },
    ],
  },
  {
    id: "about",
    label: "À propos",
    path: "/a-propos",
    fields: [
      { key: "about.title", label: "Titre", type: "text", default: "QUI SOMMES-NOUS ?" },
      { key: "about.image1", label: "Image 1", type: "image", default: teamImage },
      { key: "about.p1", label: "Paragraphe 1", type: "textarea", default: "Dada Hip Hop Academy est un centre artistique et sportif conçu pour inspirer, former et accompagner les talents de tous âges." },
      { key: "about.p2", label: "Paragraphe 2", type: "textarea", default: "Fondé par Ghada Belgacem, danseuse, coach et créatrice de contenus, notre espace met en avant les valeurs de la culture urbaine : énergie, créativité, liberté et dépassement." },
      { key: "about.cta", label: "Bouton", type: "text", default: "voir les cours" },
      { key: "about.p3", label: "Paragraphe 3", type: "textarea", default: "Nous offrons un environnement où chacun peut évoluer à son rythme : passionnés, débutants, athlètes, artistes, enfants, adultes…" },
      { key: "about.p4", label: "Paragraphe 4 (objectif)", type: "textarea", default: "révéler le potentiel de chaque individu à travers le mouvement et la création." },
      { key: "about.image2", label: "Image 2", type: "image", default: dancersImage },
      { key: "about.mission", label: "Mission", type: "textarea", default: "Promouvoir la danse, le bien-être et la création artistique à travers un espace moderne et inclusif." },
      { key: "about.vision", label: "Vision", type: "textarea", default: "Créer une plateforme culturelle et sportive qui révèle les talents et inspire la nouvelle génération." },
    ],
  },
  {
    id: "cours",
    label: "Cours & Activités",
    path: "/cours-activites",
    fields: [
      { key: "cours.hero.image", label: "Image hero", type: "image", default: coursHero },
      { key: "cours.title", label: "Titre", type: "text", default: "NOS COURS & ACTIVITÉS" },
      { key: "cours.intro", label: "Introduction", type: "textarea", default: "Découvrez une variété de cours conçus pour développer votre technique, votre forme physique et votre créativité. Nos coachs qualifiés vous accompagnent à chaque étape." },
      { key: "cours.cta", label: "Bouton contact", type: "text", default: "Contacter Nous" },
      { key: "cours.section.title", label: "Sous-titre cours", type: "text", default: "TOUS NOS COURS" },
      { key: "cours.section.sub", label: "Sous-sous-titre", type: "text", default: "Des programmes adaptés à tous les niveaux, du débutant à l'expert." },
      { key: "cours.plan.image", label: "Image planning", type: "image", default: coursPlan },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    path: "/contact",
    fields: [
      { key: "contact.title", label: "Titre", type: "text", default: "CONTACTEZ-NOUS" },
      { key: "contact.intro", label: "Introduction", type: "textarea", default: "Pour toute demande d'information, d'inscription ou de collaboration, contactez-nous par téléphone ou directement sur nos réseaux sociaux." },
      { key: "contact.facebook", label: "Facebook - texte", type: "text", default: "DADA HipHop Academy" },
      { key: "contact.facebook.url", label: "Facebook - lien", type: "text", default: "https://www.facebook.com/profile.php?id=61585478522995" },
      { key: "contact.instagram", label: "Instagram - texte", type: "text", default: "dada.hiphop.academy1" },
      { key: "contact.instagram.url", label: "Instagram - lien", type: "text", default: "https://www.instagram.com/dada.hiphop.academy1/" },
      { key: "contact.email", label: "Email", type: "text", default: "contact.dadahiphop@gmail.com" },
      { key: "contact.phone", label: "Téléphone", type: "text", default: "97 800 464" },
      { key: "contact.address", label: "Adresse", type: "text", default: "Tunis, Tunisie" },
    ],
  },
  {
    id: "reseaux",
    label: "Dada Réseaux Artist",
    path: "/dada-reseaux-artist",
    fields: [
      { key: "reseaux.hero.image", label: "Image hero", type: "image", default: heroImage },
      { key: "reseaux.hero.title", label: "Titre hero", type: "text", default: "DADA RESEAUX ARTIST" },
      { key: "reseaux.hero.subtitle", label: "Sous-titre hero", type: "text", default: "Un espace conçu pour vous mettre en lumière" },
      { key: "reseaux.hero.cta1", label: "Bouton 1", type: "text", default: "Se connecter" },
      { key: "reseaux.hero.cta2", label: "Bouton 2", type: "text", default: "Créer un compte" },
      { key: "reseaux.section.title1", label: "Section - titre partie 1", type: "text", default: "DECOUVRIR" },
      { key: "reseaux.section.title2", label: "Section - titre partie 2 (rouge)", type: "text", default: "NOS ARTISTES" },
      { key: "reseaux.search.placeholder", label: "Recherche - placeholder", type: "text", default: "Rechercher un artiste" },
    ],
  },
  {
    id: "workshops",
    label: "Workshops",
    path: "/workshops",
    fields: [
      { key: "workshops.title1", label: "Titre ligne 1", type: "text", default: "WORKSHOPS &" },
      { key: "workshops.title2", label: "Titre ligne 2", type: "text", default: "ÉVÉNEMENTS" },
      { key: "workshops.intro", label: "Introduction", type: "textarea", default: "Notre studio professionnel est ouvert aux chanteurs, rappeurs, danseurs, beatmakers et créateurs de contenu. Il permet d'enregistrer, produire, mixer, filmer et expérimenter dans un cadre moderne." },
      { key: "workshops.section", label: "Sous-titre section", type: "text", default: "PROCHAINS EVENEMENTS" },
    ],
  },
];
