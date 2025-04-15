"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Player } from "@/lib/game-logic"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface VotePhaseProps {
  players: Player[]
  onVoteComplete: (votedPlayerId: number) => void
  eliminatedPlayer: Player | null
}

export const VotePhase = ({ players, onVoteComplete, eliminatedPlayer }: VotePhaseProps) => {
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  const handleVote = () => {
    if (selectedPlayer !== null) {
      setShowResult(true)
    }
  }

  const handleContinue = () => {
    if (selectedPlayer !== null) {
      onVoteComplete(selectedPlayer)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Phase de vote</CardTitle>
        <CardDescription>Votez pour éliminer un joueur que vous suspectez</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {showResult ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Joueur éliminé</AlertTitle>
              <AlertDescription>{players[selectedPlayer!].name} a été éliminé !</AlertDescription>
            </Alert>

            {eliminatedPlayer && (
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-center">
                <h3 className="font-medium mb-2">{eliminatedPlayer.name} était :</h3>
                <Badge
                  variant={
                    eliminatedPlayer.role === "civilian"
                      ? "default"
                      : eliminatedPlayer.role === "undercover"
                        ? "destructive"
                        : "outline"
                  }
                  className="mb-2"
                >
                  {eliminatedPlayer.role === "civilian"
                    ? "Civil"
                    : eliminatedPlayer.role === "undercover"
                      ? "Undercover"
                      : "Mister White"}
                </Badge>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Indices donnés :</h3>
            <ScrollArea className="h-48 border rounded-md p-2">
              <div className="space-y-3">
                {players.map((player, index) => (
                  <div key={index} className="space-y-1">
                    <div className="font-medium">{player.name}</div>
                    <div className="pl-4 space-y-1">
                      {player.clues.map((clue, i) => (
                        <div key={i} className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
                          {clue}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Votez pour éliminer :</h3>
              <div className="grid grid-cols-2 gap-2">
                {players.map((player, index) => (
                  <Button
                    key={index}
                    variant={selectedPlayer === index ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setSelectedPlayer(index)}
                  >
                    {player.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {showResult ? (
          <Button onClick={handleContinue} className="w-full">
            Continuer
          </Button>
        ) : (
          <Button onClick={handleVote} className="w-full" disabled={selectedPlayer === null}>
            Voter
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
