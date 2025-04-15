"use client"

import { useState } from "react"
import { JoinGame } from "./join-game"
import { Lobby } from "./lobby"

interface OnlineModeProps {
  onBack: () => void
}

export const OnlineMode = ({ onBack }: OnlineModeProps) => {
  const [roomId, setRoomId] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)

  const handleJoined = (roomId: string, isHost: boolean) => {
    setRoomId(roomId)
    setIsHost(isHost)
  }

  const handleBackFromLobby = () => {
    setRoomId(null)
  }

  if (roomId) {
    return <Lobby roomId={roomId} isHost={isHost} onBack={handleBackFromLobby} />
  }

  return <JoinGame onBack={onBack} onJoined={handleJoined} />
}
