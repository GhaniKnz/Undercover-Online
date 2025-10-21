"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { GamePlay } from "./game-play"
import { Plus, Trash2, Users, ArrowLeft } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { OPTIONAL_ROLE_IDS, ROLE_DEFINITIONS, type PlayerRole } from "@/lib/game-logic"

interface GameSetupProps {
  onBack?: () => void
}

export const GameSetup = ({ onBack }: GameSetupProps) => {
  const [players, setPlayers] = useState<string[]>([])
  const [newPlayer, setNewPlayer] = useState("")
  const [includeMisterWhite, setIncludeMisterWhite] = useState(false)
  const [selectedOptionalRoles, setSelectedOptionalRoles] = useState<PlayerRole[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const optionalRoles = useMemo(() => [...OPTIONAL_ROLE_IDS], [])

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
    return (
      <GamePlay
        players={players}
        includeMisterWhite={includeMisterWhite}
        optionalRoles={selectedOptionalRoles}
      />
    )
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex flex-col text-cyan-200">
                <span>Rôles optionnels</span>
                <span className="text-sm text-cyan-400/70">
                  Activez des variantes pour pimenter la partie
                </span>
              </Label>
              <Badge variant="outline" className="text-xs text-cyan-200 border-cyan-900/60">
                {selectedOptionalRoles.length}/{optionalRoles.length}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {optionalRoles.map((roleId) => {
                const role = ROLE_DEFINITIONS[roleId]
                const checked = selectedOptionalRoles.includes(roleId)

                    return (
                      <label
                        key={roleId}
                        htmlFor={`role-${roleId}`}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border border-cyan-900/40 bg-slate-800/30 p-3 transition hover:border-cyan-700/70 ${
                          checked ? "ring-1 ring-cyan-500/60" : ""
                        }`}
                      >
                        <Checkbox
                          id={`role-${roleId}`}
                          checked={checked}
                          onCheckedChange={(value) => {
                            setSelectedOptionalRoles((current) =>
                              value === true
                                ? [...current, roleId]
                                : current.filter((existing) => existing !== roleId),
                            )
                          }}
                          className="border-cyan-900 data-[state=checked]:bg-cyan-500"
                        />
                    <div className="space-y-1">
                      <p className="font-medium text-cyan-100">{role.name}</p>
                      <p className="text-xs text-cyan-200/70 leading-snug">{role.description}</p>
                      {role.ability && (
                        <p className="text-[11px] text-cyan-300/80">{role.ability}</p>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
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
