import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Undercover - Jeu de déduction sociale",
  description:
    "Un jeu de déduction sociale où les joueurs doivent découvrir qui sont les undercover",
  generator: "v0.dev",
};

const inter = Inter({ subsets: ["latin"] });

// Définition inline d'un composant client pour vos providers
const Providers = (props: { children: React.ReactNode }) => {
  "use client"; // Indique que ce composant sera rendu uniquement côté client
  // Import dynamique des providers au moment de l'exécution côté client
  const { ThemeProvider } = require("@/components/theme-provider");
  const { SocketProvider } = require("@/hooks/use-socket");

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <SocketProvider>{props.children}</SocketProvider>
    </ThemeProvider>
  );
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
