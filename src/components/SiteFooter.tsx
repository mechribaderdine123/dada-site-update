import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/dada-logo.png";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-card/40">
      <div className="max-w-7xl mx-auto px-6 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <img src={logo} alt="Dada Hip Hop Academy" className="h-16 w-auto" />
          <p className="mt-4 text-sm text-muted-foreground max-w-md leading-relaxed">
            Un centre artistique et sportif où chaque talent trouve son expression. Danse, gymnastique, arts martiaux et création — pour tous les âges.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a href="https://www.facebook.com/profile.php?id=61585478522995" target="_blank" rel="noreferrer" className="w-10 h-10 grid place-items-center rounded-full border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="https://www.instagram.com/dada.hiphop.academy1/" target="_blank" rel="noreferrer" className="w-10 h-10 grid place-items-center rounded-full border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition">
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-display text-lg tracking-wider">Navigation</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-primary">Accueil</Link></li>
            <li><Link to="/a-propos" className="hover:text-primary">À propos</Link></li>
            <li><Link to="/cours-activites" className="hover:text-primary">Cours & Activités</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            <li><Link to="/dada-reseaux-artist" className="hover:text-primary">Dada Réseaux Artist</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg tracking-wider">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><Mail className="w-4 h-4 mt-0.5 text-primary" /> contact.dadahiphop@gmail.com</li>
            <li className="flex items-start gap-2"><Phone className="w-4 h-4 mt-0.5 text-primary" /> 97 800 464</li>
            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-primary" /> Tunis, Tunisie</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="max-w-7xl mx-auto px-6 py-5 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Dada Hip Hop Academy. Tous droits réservés.</span>
          <span>Fondé par Ghada Belgacem</span>
        </div>
      </div>
    </footer>
  );
}
