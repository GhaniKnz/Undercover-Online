"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Copy, Users, Crown } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSocket } from "@/hooks/use-socket"
import { OnlineGamePlay } from "./online-game-play"

interface LobbyProps {
  roomId: string
  isHost: boolean
  onBack: () => void
}

interface Player {
  id: string
  name: string
  isHost: boolean
  ready: boolean
}

interface GameSettings {
  includeMisterWhite: boolean
  useCustomWords: boolean
  maxRounds: number
}

export const Lobby = ({ roomId, isHost, onBack }: LobbyProps) => {
  const [players, setPlayers] = useState<Player[]>([])
  const [settings, setSettings] = useState<GameSettings>({
    includeMisterWhite: false,
    useCustomWords: false,
    maxRounds: 2,
  })
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return

    // Écouter les mises à jour des joueurs
    socket.on("players_update", (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers)
    })

    // Écouter les mises à jour des paramètres
    socket.on("settings_updated", (updatedSettings: GameSettings) => {
      setSettings(updatedSettings)
    })

    // Écouter le démarrage du jeu
    socket.on("game_started", () => {
      setGameStarted(true)
    })

    return () => {
      socket.off("players_update")
      socket.off("settings_updated")
      socket.off("game_started")
    }
  }, [socket])

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleMisterWhite = (checked: boolean) => {
    if (!isHost) return

    const newSettings = { ...settings, includeMisterWhite: checked }
    setSettings(newSettings)

    socket.emit("update_settings", { roomId, settings: newSettings }, (response: any) => {
      if (!response.success) {
        setError(response.message || "Erreur lors de la mise à jour des paramètres")
      }
    })
  }

  const handleToggleCustomWords = (checked: boolean) => {
    if (!isHost) return

    const newSettings = { ...settings, useCustomWords: checked }
    setSettings(newSettings)

    socket.emit("update_settings", { roomId, settings: newSettings }, (response: any) => {
      if (!response.success) {
        setError(response.message || "Erreur lors de la mise à jour des paramètres")
      }
    })
  }

  const handleSetMaxRounds = (rounds: number) => {
    if (!isHost) return

    const newSettings = { ...settings, maxRounds: rounds }
    setSettings(newSettings)

    socket.emit("update_settings", { roomId, settings: newSettings }, (response: any) => {
      if (!response.success) {
        setError(response.message || "Erreur lors de la mise à jour des paramètres")
      }
    })
  }

  const handleReady = () => {
    socket.emit("player_ready", { roomId }, (response: any) => {
      if (!response.success) {
        setError("Erreur lors de la mise à jour de votre statut")
      }
    })
  }

  const handleStartGame = () => {
    if (!isHost) return

    if (players.length < 3) {
      setError("Il faut au moins 3 joueurs pour commencer")
      return
    }

    socket.emit("start_game", { roomId }, (response: any) => {
      if (!response.success) {
        setError(response.message || "Erreur lors du démarrage de la partie")
      }
    })
  }

  if (gameStarted) {
    return <OnlineGamePlay roomId={roomId} />
  }

  return (
    <div className="w-full bg-game p-4 rounded-lg">
      <Card className="w-full bg-slate-900/70 backdrop-blur-sm card-neon">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4 text-cyan-300 hover:text-cyan-100 hover:bg-slate-800/50"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-center text-cyan-300">Salle d'attente</CardTitle>
          <CardDescription className="text-center text-cyan-100">
            Code de la salle:
            <span className="font-mono ml-2 bg-slate-800 px-2 py-1 rounded">{roomId}</span>
            <Button
              variant="ghost"
              size="icon"
              className="ml-2 text-cyan-300 hover:text-cyan-100"
              onClick={handleCopyRoomId}
            >
              <Copy className="h-4 w-4" />
            </Button>
            {copied && <span className="text-green-400 ml-2">Copié!</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium flex items-center gap-2 text-cyan-200">
                <Users size={18} />
                Joueurs ({players.length}/8)
              </Label>
            </div>

            <ScrollArea className="h-48 border rounded-md p-2 border-cyan-900/50 bg-slate-800/30">
              {players.length === 0 ? (
                <p className="text-center text-cyan-500/50 py-8">Chargement des joueurs...</p>
              ) : (
                <ul className="space-y-2">
                  {players.map((player) => (
                    <li
                      key={player.id}
                      className="flex items-center justify-between p-2 bg-slate-800/50 rounded border border-cyan-900/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-100">{player.name}</span>
                        {player.isHost && <Crown className="h-4 w-4 text-yellow-400" />}
                      </div>
                      <div className="flex items-center">
                        {player.ready ? (
                          <span className="text-green-400 text-sm">Prêt</span>
                        ) : (
                          <span className="text-gray-400 text-sm">En attente</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </div>

          {isHost && (
            <div className="space-y-4 pt-2 border-t border-cyan-900/30">
              <h3 className="text-lg font-medium text-cyan-200">Paramètres de la partie</h3>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="mister-white" className="flex flex-col text-cyan-200">
                  <span>Ajouter un Mister White</span>
                  <span className="text-sm text-cyan-400/70">Disponible à partir de 3 joueurs</span>
                </Label>
                <Switch
                  id="mister-white"
                  checked={settings.includeMisterWhite}
                  onCheckedChange={handleToggleMisterWhite}
                  disabled={players.length < 3}
                  className="data-[state=checked]:bg-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="custom-words" className="flex flex-col text-cyan-200">
                  <span>Utiliser des mots personnalisés</span>
                  <span className="text-sm text-cyan-400/70">Utilise vos paires de mots créées</span>
                </Label>
                <Switch
                  id="custom-words"
                  checked={settings.useCustomWords}
                  onCheckedChange={handleToggleCustomWords}
                  className="data-[state=checked]:bg-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-cyan-200">Nombre de tours d'indices</Label>
                <div className="flex gap-2">
                  {[1, 2, 3].map((rounds) => (
                    <Button
                      key={rounds}
                      variant={settings.maxRounds === rounds ? "default" : "outline"}
                      className={settings.maxRounds === rounds ? "bg-cyan-600" : "border-cyan-900 text-cyan-300"}
                      onClick={() => handleSetMaxRounds(rounds)}
                    >
                      {rounds}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {isHost ? (
            <Button
              onClick={handleStartGame}
              className="w-full bg-cyan-600 hover:bg-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/50"
              disabled={players.length < 3 || !players.every((p) => p.ready || p.isHost)}
            >
              Commencer la partie
            </Button>
          ) : (
            <Button
              onClick={handleReady}
              className="w-full bg-cyan-600 hover:bg-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/50"
              disabled={players.find((p) => p.id === socket?.id)?.ready}
            >
              Je suis prêt
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
