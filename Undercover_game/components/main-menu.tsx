"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GameSetup } from "./game-setup"
import { CustomWordSetup } from "./custom-word-setup"
import { OnlineMode } from "./online/online-mode"
import { Settings, Globe, Users } from "lucide-react"

type MenuState = "main" | "play" | "custom" | "online"

export const MainMenu = () => {
  const [menuState, setMenuState] = useState<MenuState>("main")

  if (menuState === "play") {
    return <GameSetup onBack={() => setMenuState("main")} />
  }

  if (menuState === "custom") {
    return <CustomWordSetup onBack={() => setMenuState("main")} />
  }

  if (menuState === "online") {
    return <OnlineMode onBack={() => setMenuState("main")} />
  }

  return (
    <Card className="w-full bg-slate-900/70 backdrop-blur-sm card-neon">
      <CardHeader>
        <CardTitle className="text-center text-cyan-300">Menu Principal</CardTitle>
        <CardDescription className="text-center text-cyan-100">Choisissez votre mode de jeu</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          className="w-full flex items-center justify-center gap-2 py-6 text-lg bg-cyan-600 hover:bg-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/50"
          onClick={() => setMenuState("play")}
        >
          <Users className="h-5 w-5" />
          Jouer en local
        </Button>
        <Button
          className="w-full flex items-center justify-center gap-2 py-6 text-lg bg-cyan-700 hover:bg-cyan-600 transition-all hover:shadow-lg hover:shadow-cyan-500/50"
          onClick={() => setMenuState("online")}
        >
          <Globe className="h-5 w-5" />
          Jouer en ligne
        </Button>
        <Button
          className="w-full flex items-center justify-center gap-2 py-6 text-lg bg-transparent border border-cyan-500 text-cyan-300 hover:bg-cyan-900/50 transition-all"
          variant="outline"
          onClick={() => setMenuState("custom")}
        >
          <Settings className="h-5 w-5" />
          Mots personnalisés
        </Button>
      </CardContent>
    </Card>
  )
}
