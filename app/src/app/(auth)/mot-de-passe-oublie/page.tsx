import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { requestPasswordReset } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default async function ForgotPage({ searchParams }: { searchParams: Promise<{ envoye?: string }> }) {
  const { envoye } = await searchParams;
  return (
    <div className="glass auth-card">
      <Logo href="/connexion" />
      <h1>Mot de passe oublié.</h1>
      <p className="lead">Indiquez votre e-mail. Si un compte existe, vous recevrez un lien pour choisir un nouveau mot de passe.</p>
      {envoye ? (
        <div className="alert alert-ok">Si cet e-mail correspond à un compte, un lien vient de partir. Pensez à vérifier vos indésirables. Vous pouvez aussi écrire à djouzar@penseria.fr.</div>
      ) : (
        <form action={requestPasswordReset} className="form">
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" className="input" autoComplete="email" required autoFocus />
          </div>
          <button type="submit" className="btn btn-primary btn-block">Recevoir le lien</button>
        </form>
      )}
      <div className="auth-foot">
        <Link href="/connexion">Retour à la connexion</Link>
      </div>
    </div>
  );
}
