"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Player } from "@/lib/game-logic"
import { Badge } from "@/components/ui/badge"

interface MisterWhiteGuessProps {
  player: Player
  civilianWord: { word: string; definition: string }
  onGuessComplete: (guess: string, correct: boolean) => void
}

export const MisterWhiteGuess = ({ player, civilianWord, onGuessComplete }: MisterWhiteGuessProps) => {
  const [guess, setGuess] = useState("")
  const [guessed, setGuessed] = useState(false)
  const [correct, setCorrect] = useState(false)

  const handleGuess = () => {
    if (guess.trim()) {
      const isCorrect = guess.trim().toLowerCase() === civilianWord.word.toLowerCase()
      setCorrect(isCorrect)
      setGuessed(true)

      // Delay to show the result before continuing
      setTimeout(() => {
        onGuessComplete(guess.trim(), isCorrect)
      }, 3000)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Chance du Mister White</CardTitle>
        <CardDescription>{player.name} a été éliminé et était le Mister White</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-center">
          <h3 className="font-medium mb-2">{player.name} était :</h3>
          <Badge variant="outline" className="mb-2">
            Mister White
          </Badge>
          <p className="text-sm mt-2">Le Mister White a une chance de gagner en devinant le mot des Civils</p>
        </div>

        {!guessed ? (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Devinez le mot des Civils :</h3>
            <Input
              placeholder="Entrez votre réponse..."
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGuess()}
            />
          </div>
        ) : (
          <div className="text-center p-4">
            <h3 className="text-xl font-bold mb-4">{correct ? "Correct !" : "Incorrect !"}</h3>
            <p className="mb-2">
              Le mot était : <span className="font-bold">{civilianWord.word}</span>
            </p>
            <p className="text-sm text-muted-foreground">{civilianWord.definition}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!guessed ? (
          <Button onClick={handleGuess} className="w-full" disabled={!guess.trim()}>
            Valider ma réponse
          </Button>
        ) : (
          <Button disabled className="w-full">
            {correct ? "Vous avez gagné !" : "Vous avez perdu !"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
