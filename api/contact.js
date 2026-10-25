// Formulaire de contact : envoie chaque demande par e-mail à Djouzar, via l'API Resend.
// Variable d'environnement requise sur Vercel : RESEND_API_KEY.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  const body = req.body || {};
  // champ invisible : rempli seulement par les robots
  if (body._honey) return res.status(200).json({ success: true });

  const email = String(body.email || '').trim();
  const message = String(body.message || '').slice(0, 5000);
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false });
  }
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ success: false });

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Empreinte <onboarding@resend.dev>',
      to: ['djouzar@penseria.fr'],
      reply_to: email,
      subject: 'Bootcamp Empreinte : nouvelle demande',
      text: 'Nouvelle demande depuis le site Empreinte.\n\nE-mail : ' + email + '\n\nMessage :\n' + message + '\n\nRépondez directement à ce mail pour écrire à la personne.'
    })
  });
  return res.status(r.ok ? 200 : 502).json({ success: r.ok });
};
