import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { updatePassword } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function NewPasswordPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  return (
    <div className="glass auth-card">
      <Logo href="/" />
      <h1>Nouveau mot de passe.</h1>
      <p className="lead">Choisissez un mot de passe d'au moins 8 caractères.</p>
      {erreur && <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>{erreur}</div>}
      <form action={updatePassword} className="form">
        <div className="field">
          <label htmlFor="password">Nouveau mot de passe</label>
          <input id="password" name="password" type="password" className="input" autoComplete="new-password" minLength={8} required autoFocus />
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirmez-le</label>
          <input id="confirm" name="confirm" type="password" className="input" autoComplete="new-password" minLength={8} required />
        </div>
        <button type="submit" className="btn btn-primary btn-block">Enregistrer</button>
      </form>
    </div>
  );
}
