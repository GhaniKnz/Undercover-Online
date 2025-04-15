"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Player } from "@/lib/game-logic"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface TurnPhaseProps {
  player: Player
  round: number
  players: Player[]
  onClueSubmitted: (clue: string) => void
}

export const TurnPhase = ({ player, round, players, onClueSubmitted }: TurnPhaseProps) => {
  const [clue, setClue] = useState("")
  const [ready, setReady] = useState(false)

  const handleSubmit = () => {
    if (clue.trim()) {
      onClueSubmitted(clue.trim())
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          Tour {round} - {player.name}
        </CardTitle>
        <CardDescription>Donnez un indice sur votre mot sans être trop évident</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!ready ? (
          <div className="text-center p-6">
            <h3 className="text-xl font-bold mb-4">Au tour de {player.name}</h3>
            <p className="mb-6">Passez le téléphone à {player.name}</p>
            <Button onClick={() => setReady(true)}>Je suis {player.name}</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Indices précédents :</h3>
              <ScrollArea className="h-48 border rounded-md p-2">
                {players.some((p) => p.clues.length > 0) ? (
                  <div className="space-y-3">
                    {players.map(
                      (p, index) =>
                        p.clues.length > 0 && (
                          <div key={index} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{p.name}</span>
                              {p.eliminated && (
                                <Badge variant="outline" className="text-xs">
                                  Éliminé
                                </Badge>
                              )}
                            </div>
                            <div className="pl-4 space-y-1">
                              {p.clues.map((c, i) => (
                                <div key={i} className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
                                  {c}
                                </div>
                              ))}
                            </div>
                          </div>
                        ),
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Aucun indice donné pour l'instant</p>
                )}
              </ScrollArea>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Votre indice :</h3>
              <Input
                placeholder="Entrez votre indice..."
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        {ready && (
          <Button onClick={handleSubmit} className="w-full" disabled={!clue.trim()}>
            Valider mon indice
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
