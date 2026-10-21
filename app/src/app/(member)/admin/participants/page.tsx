import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Notice } from "@/components/admin/Notice";
import { CopyButton } from "@/components/CopyButton";
import { createParticipant, deleteParticipant, resetParticipantPassword, updateParticipant } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; etat?: string; nouveau?: string; mdp?: string }>;
}) {
  const { message, etat, nouveau, mdp } = await searchParams;
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("*").order("created_at");
  const profiles = (data ?? []) as Profile[];
  const created = nouveau ? profiles.find((p) => p.id === nouveau) : null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const mailText = created && mdp
    ? `Bonjour ${created.full_name.split(" ")[0] || ""},\n\nVoici vos accès à l'espace membre du bootcamp Empreinte :\n\nAdresse : ${siteUrl}\nIdentifiant : ${created.email}\nMot de passe : ${mdp}\n\nVous y trouverez l'agenda des lives (et l'inscription aux Labs), les vidéos de la formation et les ressources.\n\nÀ très vite,\nDjouzar`
    : "";

  return (
    <>
      <Notice message={message} etat={etat} />

      {created && mdp && (
        <div className="glass card" style={{ marginBottom: 18, borderColor: "var(--accent)" }}>
          <span className="label">Accès à transmettre à {created.full_name || created.email}</span>
          <p className="small muted" style={{ marginBottom: 10 }}>Le mot de passe n'est affiché qu'une seule fois. Copiez le message ci-dessous et envoyez-le par e-mail.</p>
          <div className="code-box" style={{ whiteSpace: "pre-wrap", wordBreak: "normal" }}>{mailText}</div>
          <div className="form-actions" style={{ marginTop: 12 }}>
            <CopyButton text={mailText} label="Copier le message" />
            <CopyButton text={mdp} label="Copier le mot de passe seul" />
            <a className="btn btn-ghost btn-sm" href={`mailto:${created.email}?subject=${encodeURIComponent("Vos accès à l'espace Empreinte")}&body=${encodeURIComponent(mailText)}`}>Ouvrir dans ma messagerie</a>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="glass card">
          <h2>Ajouter un participant</h2>
          <form action={createParticipant} className="form" style={{ marginTop: 10 }}>
            <div className="field">
              <label htmlFor="p-name">Prénom et nom</label>
              <input id="p-name" name="full_name" className="input" required />
            </div>
            <div className="field">
              <label htmlFor="p-email">E-mail</label>
              <input id="p-email" name="email" type="email" className="input" required />
            </div>
            <div className="field">
              <label htmlFor="p-pass">Mot de passe (facultatif)</label>
              <input id="p-pass" name="password" className="input" minLength={8} placeholder="Généré automatiquement si vide" />
            </div>
            <button type="submit" className="btn btn-primary">Créer le compte</button>
          </form>
        </div>

        <div className="glass card">
          <h2>Comptes ({profiles.length})</h2>
          <div className="list" style={{ marginTop: 10 }}>
            {profiles.map((p) => (
              <div key={p.id} className="item" style={{ flexWrap: "wrap" }}>
                <form action={updateParticipant} className="grow row" style={{ gap: 8 }}>
                  <input type="hidden" name="id" value={p.id} />
                  <input name="full_name" className="input" defaultValue={p.full_name} aria-label="Nom" style={{ flex: "1 1 160px" }} />
                  <button type="submit" className="btn btn-ghost btn-sm">Renommer</button>
                </form>
                <div className="sub" style={{ width: "100%" }}>
                  {p.email}{p.role === "admin" && <span className="pill pill-spark" style={{ marginLeft: 8 }}>Admin</span>}
                </div>
                {p.id !== user.id && (
                  <div className="row" style={{ gap: 6 }}>
                    <form action={resetParticipantPassword}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmButton className="btn btn-ghost btn-sm" message={`Générer un nouveau mot de passe pour ${p.email} ? L'ancien ne fonctionnera plus.`}>Nouveau mot de passe</ConfirmButton>
                    </form>
                    <form action={deleteParticipant}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmButton message={`Supprimer définitivement le compte de ${p.email} ?`}>Supprimer</ConfirmButton>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
