import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { SocketProvider } from "@/hooks/use-socket"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Undercover - Jeu de déduction sociale",
  description: "Un jeu de déduction sociale où les joueurs doivent découvrir qui sont les undercover",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <SocketProvider>{children}</SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'