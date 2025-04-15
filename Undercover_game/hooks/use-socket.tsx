"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { io, type Socket } from "socket.io-client"

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
})

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // URL du serveur Socket.IO
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"

    // Créer la connexion Socket.IO
    const socketInstance = io(socketUrl)

    // Gérer les événements de connexion
    socketInstance.on("connect", () => {
      console.log("Socket.IO connected")
      setIsConnected(true)
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket.IO disconnected")
      setIsConnected(false)
    })

    setSocket(socketInstance)

    // Nettoyer la connexion à la déconnexion
    return () => {
      socketInstance.disconnect()
    }
  }, [])

  return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>
}

export const useSocket = () => useContext(SocketContext)
