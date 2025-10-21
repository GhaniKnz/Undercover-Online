"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Player } from "@/lib/game-logic"
import { Badge } from "@/components/ui/badge"
import { ROLE_DEFINITIONS } from "@/lib/game-logic"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ResultsPhaseProps {
  winner: "civilians" | "undercovers" | "mister-white" | "saboteur" | null
  players: Player[]
  civilianWord: { word: string; definition: string }
  undercoverWord: { word: string; definition: string }
  onNewGame: () => void
}

export const ResultsPhase = ({ winner, players, civilianWord, undercoverWord, onNewGame }: ResultsPhaseProps) => {
  // Nous n'utilisons pas l'effet confetti pour éviter les problèmes de dépendances

  const getWinnerText = () => {
    switch (winner) {
      case "civilians":
        return "Les Civils ont gagné !"
      case "undercovers":
        return "Les Undercover ont gagné !"
      case "mister-white":
        return "Le Mister White a gagné !"
      case "saboteur":
        return "Le Saboteur a triomphé !"
      default:
        return "Partie terminée"
    }
  }

  const getRoleDisplay = (player: Player) => {
    const currentLabel = ROLE_DEFINITIONS[player.role]?.name ?? player.role
    const originalRole = player.metadata.thiefOriginalRole

    if (originalRole && originalRole !== player.role) {
      const originalLabel = ROLE_DEFINITIONS[originalRole]?.name ?? originalRole
      return `${originalLabel} → ${currentLabel}`
    }

    return currentLabel
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{getWinnerText()}</CardTitle>
        <CardDescription>La partie est terminée</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Mot des Civils :</h3>
            <p className="text-lg font-bold mb-1">{civilianWord.word}</p>
            <p className="text-sm text-muted-foreground">{civilianWord.definition}</p>
          </div>

          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Mot des Undercover :</h3>
            <p className="text-lg font-bold mb-1">{undercoverWord.word}</p>
            <p className="text-sm text-muted-foreground">{undercoverWord.definition}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Rôles des joueurs :</h3>
          <ScrollArea className="h-48 border rounded-md p-2">
            <div className="space-y-2">
              {players.map((player, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded"
                >
                  <span>{player.name}</span>
                  <Badge
                    variant={
                      player.team === "civilians"
                        ? "default"
                        : player.team === "undercovers"
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {getRoleDisplay(player)}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onNewGame} className="w-full">
          Nouvelle partie
        </Button>
      </CardFooter>
    </Card>
  )
}
