export function Notice({ message, etat }: { message?: string; etat?: string }) {
  if (!message) return null;
  return (
    <div className={`alert ${etat === "erreur" ? "alert-error" : "alert-ok"}`} role="status" style={{ marginBottom: 20 }}>
      {message}
    </div>
  );
}
