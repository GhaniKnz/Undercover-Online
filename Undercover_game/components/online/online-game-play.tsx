"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSocket } from "@/hooks/use-socket"
import type { GameState } from "@/lib/game-logic"

interface OnlineGamePlayProps {
  roomId: string
}

export const OnlineGamePlay = ({ roomId }: OnlineGamePlayProps) => {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return

    // Écouter les mises à jour du jeu
    socket.on("game_started", (data: { gameState: GameState }) => {
      setGameState(data.gameState)
    })

    socket.on("game_updated", (data: { gameState: GameState }) => {
      setGameState(data.gameState)
    })

    return () => {
      socket.off("game_started")
      socket.off("game_updated")
    }
  }, [socket, roomId])

  if (!gameState) {
    return (
      <div className="w-full bg-game p-4 rounded-lg">
        <Card className="w-full bg-slate-900/70 backdrop-blur-sm card-neon">
          <CardHeader>
            <CardTitle className="text-center text-cyan-300">Chargement...</CardTitle>
            <CardDescription className="text-center text-cyan-100">
              En attente du démarrage de la partie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-cyan-100">Veuillez patienter pendant que la partie se charge.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full bg-game p-4 rounded-lg">
      <Card className="w-full bg-slate-900/70 backdrop-blur-sm card-neon">
        <CardHeader>
          <CardTitle className="text-center text-cyan-300">Partie en cours</CardTitle>
          <CardDescription className="text-center text-cyan-100">Profitez de votre partie !</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-cyan-100">Phase: {gameState.phase}</p>
        </CardContent>
      </Card>
    </div>
  )
}
