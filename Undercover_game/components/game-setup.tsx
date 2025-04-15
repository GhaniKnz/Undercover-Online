"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { GamePlay } from "./game-play"
import { Plus, Trash2, Users, ArrowLeft } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GameSetupProps {
  onBack?: () => void
}

export const GameSetup = ({ onBack }: GameSetupProps) => {
  const [players, setPlayers] = useState<string[]>([])
  const [newPlayer, setNewPlayer] = useState("")
  const [includeMisterWhite, setIncludeMisterWhite] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addPlayer = () => {
    if (!newPlayer.trim()) {
      setError("Le pseudo ne peut pas être vide")
      return
    }

    if (players.includes(newPlayer.trim())) {
      setError("Ce pseudo est déjà utilisé")
      return
    }

    setPlayers([...players, newPlayer.trim()])
    setNewPlayer("")
    setError(null)
  }

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index))
  }

  const startGame = () => {
    if (players.length < 3) {
      setError("Il faut au moins 3 joueurs pour commencer")
      return
    }

    setGameStarted(true)
    setError(null)
  }

  if (gameStarted) {
    return <GamePlay players={players} includeMisterWhite={includeMisterWhite} />
  }

  return (
    <div className="w-full bg-game p-4 rounded-lg">
      <Card className="w-full bg-slate-900/70 backdrop-blur-sm card-neon">
        <CardHeader className="relative">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-4 text-cyan-300 hover:text-cyan-100 hover:bg-slate-800/50"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <CardTitle className="text-center text-cyan-300">Configuration de la partie</CardTitle>
          <CardDescription className="text-center text-cyan-100">
            Ajoutez des joueurs et configurez les options de jeu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="players" className="text-lg font-medium flex items-center gap-2 text-cyan-200">
                <Users size={18} />
                Joueurs ({players.length})
              </Label>
              {error && (
                <Alert variant="destructive" className="py-2 px-3 mt-0">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                id="players"
                placeholder="Entrez un pseudo"
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                className="bg-slate-800/50 border-cyan-900 focus:border-cyan-500"
              />
              <Button onClick={addPlayer} size="icon" className="bg-cyan-600 hover:bg-cyan-500">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="h-48 border rounded-md p-2 border-cyan-900/50 bg-slate-800/30">
              {players.length === 0 ? (
                <p className="text-center text-cyan-500/50 py-8">Aucun joueur ajouté</p>
              ) : (
                <ul className="space-y-2">
                  {players.map((player, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-2 bg-slate-800/50 rounded border border-cyan-900/30"
                    >
                      <span className="text-cyan-100">{player}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePlayer(index)}
                        className="text-cyan-300 hover:text-cyan-100 hover:bg-slate-700/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="mister-white" className="flex flex-col text-cyan-200">
              <span>Ajouter un Mister White</span>
              <span className="text-sm text-cyan-400/70">Disponible à partir de 3 joueurs</span>
            </Label>
            <Switch
              id="mister-white"
              checked={includeMisterWhite}
              onCheckedChange={setIncludeMisterWhite}
              disabled={players.length < 3}
              className="data-[state=checked]:bg-cyan-500"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={startGame}
            className="w-full bg-cyan-600 hover:bg-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/50"
            disabled={players.length < 3}
          >
            Commencer la partie
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
