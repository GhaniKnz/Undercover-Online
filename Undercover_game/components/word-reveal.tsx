"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Player } from "@/lib/game-logic"
import { LockKeyhole } from "lucide-react"

interface WordRevealProps {
  player: Player
  civilianWord: { word: string; definition: string }
  undercoverWord: { word: string; definition: string }
  onComplete: () => void
}

export const WordReveal = ({ player, civilianWord, undercoverWord, onComplete }: WordRevealProps) => {
  const [revealed, setRevealed] = useState(false)

  const handleReveal = () => {
    setRevealed(true)
  }

  const handleContinue = () => {
    onComplete()
  }

  const getWordAndDefinition = () => {
    if (player.role === "civilian") {
      return civilianWord
    } else if (player.role === "undercover") {
      return undercoverWord
    } else {
      return { word: "Aucun mot", definition: "Vous devez deviner le mot des autres joueurs" }
    }
  }

  const { word, definition } = getWordAndDefinition()

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
          <div>
            <h3 className="text-2xl font-bold mb-2">{word}</h3>
            <p className="text-sm text-muted-foreground">{definition}</p>
          </div>

          <Button onClick={handleContinue} className="mt-4">
            J'ai mémorisé mon mot
          </Button>
        </div>
      )}
    </div>
  )
}
