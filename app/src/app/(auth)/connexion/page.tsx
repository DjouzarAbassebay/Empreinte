import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { signIn } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; suite?: string }>;
}) {
  const { erreur, suite } = await searchParams;
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return (
    <div className="glass auth-card">
      <Logo href="https://www.bootcamp-empreinte.fr/" />
      <span className="auth-eyebrow">Espace membre</span>
      <h1>Bon retour.</h1>
      <p className="lead">Connectez-vous pour accéder à vos lives, vos vidéos et vos ressources.</p>
      {!configured && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          Aperçu : la plateforme n'est pas encore reliée à Supabase. La connexion sera possible une fois les variables d'environnement renseignées.
        </div>
      )}
      {erreur && <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>{erreur}</div>}
      <form action={signIn} className="form">
        <input type="hidden" name="suite" value={suite ?? "/"} />
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" className="input" autoComplete="email" required autoFocus />
        </div>
        <div className="field">
          <label htmlFor="password">Mot de passe</label>
          <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
        </div>
        <button type="submit" className="btn btn-primary btn-block">Se connecter</button>
      </form>
      <div className="auth-foot">
        <Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
        <a href="https://www.bootcamp-empreinte.fr/">Retour au site</a>
      </div>
    </div>
  );
}
