"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSocket } from "@/hooks/use-socket"

interface JoinGameProps {
  onBack: () => void
  onJoined: (roomId: string, isHost: boolean) => void
}

export const JoinGame = ({ onBack, onJoined }: JoinGameProps) => {
  const [playerName, setPlayerName] = useState("")
  const [roomId, setRoomId] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { socket } = useSocket()

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError("Veuillez entrer votre pseudo")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Créer une nouvelle salle
      socket.emit("create_room", async (response: any) => {
        if (response.success) {
          const newRoomId = response.roomId

          // Rejoindre la salle créée
          socket.emit("join_room", { roomId: newRoomId, playerName }, (joinResponse: any) => {
            setLoading(false)

            if (joinResponse.success) {
              onJoined(newRoomId, joinResponse.isHost)
            } else {
              setError(joinResponse.message || "Erreur lors de la création de la salle")
            }
          })
        } else {
          setLoading(false)
          setError(response.message || "Erreur lors de la création de la salle")
        }
      })
    } catch (err) {
      setLoading(false)
      setError("Erreur de connexion au serveur")
    }
  }

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError("Veuillez entrer votre pseudo")
      return
    }

    if (!roomId.trim()) {
      setError("Veuillez entrer un code de salle")
      return
    }

    setLoading(true)
    setError(null)

    try {
      socket.emit("join_room", { roomId, playerName }, (response: any) => {
        setLoading(false)

        if (response.success) {
          onJoined(roomId, response.isHost)
        } else {
          setError(response.message || "Erreur lors de la connexion à la salle")
        }
      })
    } catch (err) {
      setLoading(false)
      setError("Erreur de connexion au serveur")
    }
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
          <CardTitle className="text-center text-cyan-300">
            {isCreating ? "Créer une partie" : "Rejoindre une partie"}
          </CardTitle>
          <CardDescription className="text-center text-cyan-100">
            {isCreating
              ? "Créez une nouvelle partie et invitez vos amis"
              : "Rejoignez une partie existante avec un code"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="player-name" className="text-cyan-200">
                Votre pseudo
              </Label>
              <Input
                id="player-name"
                placeholder="Entrez votre pseudo"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-slate-800/50 border-cyan-900 focus:border-cyan-500"
              />
            </div>

            {!isCreating && (
              <div className="space-y-2">
                <Label htmlFor="room-id" className="text-cyan-200">
                  Code de la salle
                </Label>
                <Input
                  id="room-id"
                  placeholder="Ex: ABC123"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="bg-slate-800/50 border-cyan-900 focus:border-cyan-500"
                />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {isCreating ? (
            <>
              <Button
                onClick={handleCreateRoom}
                className="w-full bg-cyan-600 hover:bg-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/50"
                disabled={loading}
              >
                {loading ? "Création en cours..." : "Créer la partie"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsCreating(false)}
                className="w-full text-cyan-300 hover:text-cyan-100 hover:bg-slate-800/50"
              >
                Rejoindre une partie existante
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleJoinRoom}
                className="w-full bg-cyan-600 hover:bg-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/50"
                disabled={loading}
              >
                {loading ? "Connexion en cours..." : "Rejoindre la partie"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsCreating(true)}
                className="w-full text-cyan-300 hover:text-cyan-100 hover:bg-slate-800/50"
              >
                Créer une nouvelle partie
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
