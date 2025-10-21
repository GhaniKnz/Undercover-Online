"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Player } from "@/lib/game-logic"
import { ROLE_DEFINITIONS } from "@/lib/game-logic"
import { LockKeyhole } from "lucide-react"

interface WordRevealProps {
  player: Player
  onComplete: () => void
}

export const WordReveal = ({ player, onComplete }: WordRevealProps) => {
  const [revealed, setRevealed] = useState(false)

  const handleReveal = () => {
    setRevealed(true)
  }

  const handleContinue = () => {
    onComplete()
  }

  const getWordAndDefinition = () => {
    if (player.word && player.definition) {
      return { word: player.word, definition: player.definition }
    }

    if (player.role === "mister-white") {
      return {
        word: "Aucun mot",
        definition: "Écoutez les autres joueurs pour deviner le mot des civils.",
      }
    }

    if (player.role === "thief") {
      return {
        word: "En attente",
        definition: "Vous obtiendrez un mot en volant le rôle d'un joueur éliminé.",
      }
    }

    return {
      word: "Pas de mot attribué",
      definition: "Suivez les règles de votre rôle pour accomplir votre objectif.",
    }
  }

  const { word, definition } = getWordAndDefinition()
  const roleDefinition = ROLE_DEFINITIONS[player.role]
  const teamLabel =
    player.team === "civilians"
      ? "Camp des Civils"
      : player.team === "undercovers"
        ? "Camp des Undercover"
        : "Camp neutre"

  return (
    <div className="text-center p-6">
      {!revealed ? (
        <Card className="cursor-pointer" onClick={handleReveal}>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <LockKeyhole className="h-16 w-16 mb-4 text-slate-400" />
            <p className="text-lg">Appuyez pour révéler votre mot</p>
          </CardContent>
        </Card>
      ) : (
        <div className="animate-fade-in space-y-6">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-wider text-cyan-300/80">{roleDefinition.name}</p>
            <Badge
              variant={
                player.team === "civilians"
                  ? "default"
                  : player.team === "undercovers"
                    ? "destructive"
                    : "outline"
              }
              className="text-xs"
            >
              {teamLabel}
            </Badge>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">{word}</h3>
            <p className="text-sm text-muted-foreground">{definition}</p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{roleDefinition.description}</p>
            {roleDefinition.ability && <p className="text-cyan-200/90">Capacité : {roleDefinition.ability}</p>}
            {player.role === "chameleon" && (
              <p>
                Infiltration actuelle :
                {" "}
                {player.metadata.chameleonWordType === "undercover" ? "Undercover" : "Civils"}
              </p>
            )}
            {player.role === "saboteur" && (
              <p>
                Survivez à {player.abilities.saboteurTargetRounds ?? 5} éliminations pour gagner la partie.
              </p>
            )}
          </div>

          <Button onClick={handleContinue} className="mt-4">
            J'ai mémorisé mon mot
          </Button>
        </div>
      )}
    </div>
  )
}
