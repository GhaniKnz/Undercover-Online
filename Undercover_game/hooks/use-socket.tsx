"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinRoom: (roomId: string, playerName: string) => Promise<any>
  createRoom: () => Promise<any>
  gameAction: (roomId: string, action: string, data: any) => Promise<any>
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinRoom: async () => ({ success: false }),
  createRoom: async () => ({ success: false }),
  gameAction: async () => ({ success: false }),
})

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // URL du serveur Socket.IO depuis les variables d'environnement
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL

    if (!socketUrl) {
      console.error("NEXT_PUBLIC_SOCKET_URL n'est pas défini")
      return
    }

    // Initialiser Socket.IO
    const socketInstance = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: true,
    })

    // Événements de connexion
    socketInstance.on("connect", () => {
      console.log("Socket.IO connecté")
      setIsConnected(true)
    })

    socketInstance.on("connect_error", (err) => {
      console.error("Erreur de connexion Socket.IO:", err.message)
      setIsConnected(false)
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket.IO déconnecté")
      setIsConnected(false)
    })

    setSocket(socketInstance)

    // Nettoyage à la déconnexion
    return () => {
      socketInstance.disconnect()
    }
  }, [])

  // Fonction pour rejoindre une salle
  const joinRoom = async (roomId: string, playerName: string) => {
    return new Promise((resolve) => {
      if (!socket) {
        resolve({ success: false, message: "Socket.IO non connecté" })
        return
      }

      socket.emit("join_room", { roomId, playerName }, (response: any) => {
        resolve(response)
      })
    })
  }

  // Fonction pour créer une salle
  const createRoom = async () => {
    return new Promise((resolve) => {
      if (!socket) {
        resolve({ success: false, message: "Socket.IO non connecté" })
        return
      }

      socket.emit("create_room", (response: any) => {
        resolve(response)
      })
    })
  }

  // Fonction pour envoyer une action de jeu
  const gameAction = async (roomId: string, action: string, data: any) => {
    return new Promise((resolve) => {
      if (!socket) {
        resolve({ success: false, message: "Socket.IO non connecté" })
        return
      }

      socket.emit("game_action", { roomId, action, data }, (response: any) => {
        resolve(response)
      })
    })
  }

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinRoom, createRoom, gameAction }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
