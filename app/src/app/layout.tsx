import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Espace Empreinte", template: "%s · Empreinte" },
  description: "Espace membre du bootcamp Empreinte : agenda des lives, formation vidéo et ressources.",
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#edeef1" },
    { media: "(prefers-color-scheme: dark)", color: "#101016" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Applique le thème mémorisé avant le premier rendu pour éviter un flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&f[]=satoshi@400,500,700&display=swap"
        />
      </head>
      <body>
        <div className="bg" aria-hidden="true">
          <div className="orb o1" />
          <div className="orb o2" />
          <div className="orb o3" />
        </div>
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
