"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Eye } from "lucide-react"

interface RoleRevealProps {
  playerName: string
  onComplete: () => void
}

export const RoleReveal = ({ playerName, onComplete }: RoleRevealProps) => {
  const [revealed, setRevealed] = useState(false)

  const handleReveal = () => {
    setRevealed(true)
    onComplete()
  }

  return (
    <div className="text-center p-6">
      <h3 className="text-2xl font-bold mb-6">{playerName}</h3>

      {!revealed ? (
        <Card className="cursor-pointer" onClick={handleReveal}>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Eye className="h-16 w-16 mb-4 text-slate-400" />
            <p className="text-lg">Appuyez pour révéler votre rôle</p>
          </CardContent>
        </Card>
      ) : (
        <div className="animate-fade-in">
          <p className="text-lg mb-4">Votre rôle va apparaître avec votre mot secret</p>
          <p className="text-sm text-muted-foreground">Ne le montrez à personne !</p>
        </div>
      )}
    </div>
  )
}
