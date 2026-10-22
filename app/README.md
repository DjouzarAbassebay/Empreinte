# Espace membre Empreinte

Plateforme privée du bootcamp Empreinte : connexion par identifiant et mot de passe, agenda des lives avec inscription aux Labs (3 places), parcours vidéo débloqué semaine par semaine avec contenu sous chaque vidéo (texte, prompts à copier, documents, listes déroulantes), ressources, et interface d'administration.

- Site de vente : racine du dépôt (statique, `www.bootcamp-empreinte.fr`).
- Espace membre : ce dossier `app/` (Next.js), à publier sur `espace.bootcamp-empreinte.fr`.

## Pile technique

| Rôle | Service | Coût |
| --- | --- | --- |
| Hébergement de l'application | Vercel (second projet, dossier `app/`) | Gratuit (plan Hobby) |
| Comptes, base de données, fichiers | Supabase | Gratuit jusqu'à 500 Mo de base et 1 Go de fichiers |
| Vidéos (stockage, encodage, lecteur) | Bunny Stream | À l'usage : environ 0,005 $/Go stocké et 0,005 $/Go diffusé |

## Mise en place (une seule fois)

### 1. Supabase

1. Créez un projet sur [supabase.com](https://supabase.com) (région **Frankfurt** ou **Paris** pour le RGPD). Notez le mot de passe de la base, il ne sert pas ici mais Supabase l'exige.
2. Ouvrez **SQL Editor**, collez l'intégralité de `supabase/schema.sql` et exécutez. Cela crée les tables, les règles de sécurité, la fonction d'inscription aux Labs et le bucket `fichiers`.
3. Dans **Authentication > Sign In / Providers > Email** : laissez Email activé et **désactivez « Confirm email »** (vous créez les comptes vous-même).
4. Dans **Authentication > URL Configuration** :
   - Site URL : `https://espace.bootcamp-empreinte.fr`
   - Redirect URLs : `https://espace.bootcamp-empreinte.fr/auth/callback`
5. Dans **Project Settings > API**, récupérez `Project URL`, la clé `anon` et la clé `service_role`.

Votre compte admin (ou un compte admin de démo), en une commande depuis le dossier `app/`, une fois `.env.local` rempli avec l'URL Supabase et la clé `service_role` :

```bash
npm run create-admin -- lamachinepensante@gmail.com Test2026 "Djouzar Abassebay"
```

La commande crée le compte (ou met à jour son mot de passe s'il existe) et lui donne le rôle admin. Relancez-la avec un autre e-mail pour chaque admin supplémentaire.

Sans Node sur votre poste, l'équivalent manuel : **Authentication > Users > Add user > Create new user** (cochez « Auto Confirm User »), puis dans **SQL Editor** :

```sql
update public.profiles set role = 'admin', full_name = 'Djouzar Abassebay'
where email = 'lamachinepensante@gmail.com';
```

Vous pourrez ensuite créer tous les comptes participants depuis l'onglet Admin > Participants de la plateforme.

### 2. Bunny Stream

1. Créez un compte sur [bunny.net](https://bunny.net), puis **Stream > Add Video Library** (nom : Empreinte, zone de stockage Europe).
2. Dans la librairie, onglet **API** : notez le **Library ID** et l'**API Key**.
3. Onglet **Security** : ajoutez `espace.bootcamp-empreinte.fr` dans **Allowed referrers** pour que les vidéos ne soient lisibles que depuis la plateforme. Vous pouvez aussi activer **Token authentication** et copier la clé dans `BUNNY_TOKEN_KEY` pour une protection renforcée (liens signés, valables 12 h).

### 3. Vercel

1. Sur [vercel.com](https://vercel.com), **Add New > Project**, importez le dépôt `Empreinte`.
2. **Root Directory** : `app`. Framework : Next.js (détecté automatiquement).
3. **Environment Variables** : recopiez les valeurs de `.env.example` :

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
BUNNY_LIBRARY_ID
BUNNY_API_KEY
BUNNY_TOKEN_KEY          (facultatif)
NEXT_PUBLIC_SITE_URL     = https://espace.bootcamp-empreinte.fr
```

4. Déployez, puis **Settings > Domains** : ajoutez `espace.bootcamp-empreinte.fr` et créez l'enregistrement DNS CNAME indiqué (chez votre registrar, celui qui gère déjà `bootcamp-empreinte.fr`).

### 4. E-mails « mot de passe oublié » (facultatif)

Le lien « Mot de passe oublié » utilise l'envoi d'e-mails de Supabase. Par défaut, Supabase n'envoie qu'aux membres du projet et à un rythme très limité. Deux options :

- **Simple** : ne rien configurer. Vous régénérez un mot de passe depuis Admin > Participants (bouton « Nouveau mot de passe ») et vous l'envoyez vous-même.
- **Complet** : dans **Authentication > Emails > SMTP Settings**, renseignez un serveur SMTP (par exemple celui de votre messagerie `djouzar@penseria.fr`, ou Resend / Brevo, gratuits à ce volume). Les e-mails partiront alors automatiquement.

## Utilisation au quotidien

**Participants** : Admin > Participants, saisissez prénom, nom et e-mail. Le mot de passe est généré et affiché une seule fois avec un message prêt à copier ou à ouvrir dans votre messagerie.

**Agenda** : Admin > Agenda. Choisissez le type (Exploration pour tout le groupe, Lab avec 3 places), la date, les heures (heure de Paris) et le lien Zoom. Pour un Lab, le lien n'est montré qu'aux inscrits. Une fois le live passé, ouvrez-le pour déposer le replay. Les participants peuvent ajouter chaque live à leur agenda ou s'abonner à un flux calendrier personnel.

**Formation** : Admin > Formation. Créez les modules (Préambule, Semaine 1…), puis les leçons. Dans chaque leçon : envoi de la vidéo (direct vers Bunny, encodage en quelques minutes) et blocs de contenu en dessous (texte, liste déroulante, prompt à copier, document, lien). Un module est **masqué par défaut** : cliquez « Débloquer pour les participants » quand la semaine commence.

**Ressources** : Admin > Ressources. Créez vos catégories (Skills thématiques, Vidéos supplémentaires, Kit d'Extraction…) puis ajoutez des documents (50 Mo max), des vidéos ou des liens.

## Développement local

```bash
cd app
cp .env.example .env.local   # puis remplissez les valeurs
npm install
npm run dev                  # http://localhost:3000
```

`npm run build` vérifie les types et construit l'application comme Vercel le fera.

## Structure

```
app/
  supabase/schema.sql        Tables, sécurité (RLS), fonction d'inscription aux Labs, bucket
  src/proxy.ts               Rafraîchit la session et protège toutes les pages
  src/app/(auth)/            Connexion, mot de passe oublié, nouveau mot de passe
  src/app/(member)/          Accueil, agenda, formation, ressources, admin
  src/app/api/               Téléchargements signés, fichiers .ics, préparation des envois vidéo
  src/lib/actions/           Actions serveur (connexion, inscriptions, administration)
  src/lib/bunny.ts           Bunny Stream : envoi, état d'encodage, URL de lecture signée
  src/components/            Interface (lecteur vidéo, blocs de contenu, éditeur admin…)
```
