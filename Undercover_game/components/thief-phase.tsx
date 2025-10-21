"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ROLE_DEFINITIONS, type Player } from "@/lib/game-logic"

interface ThiefPhaseProps {
  thief: Player
  eliminated: Player
  onSteal: () => void
  onSkip: () => void
}

const getTeamLabel = (team: Player["team"]) => {
  switch (team) {
    case "civilians":
      return "Camp des Civils"
    case "undercovers":
      return "Camp des Undercover"
    default:
      return "Camp neutre"
  }
}

export const ThiefPhase = ({ thief, eliminated, onSteal, onSkip }: ThiefPhaseProps) => {
  const eliminatedRole = ROLE_DEFINITIONS[eliminated.role]
  const thiefRole = ROLE_DEFINITIONS.thief

  return (
    <Card className="w-full bg-slate-900/70 backdrop-blur-sm card-neon">
      <CardHeader>
        <CardTitle className="text-center text-cyan-300">Pouvoir du Voleur</CardTitle>
        <CardDescription className="text-center text-cyan-100">
          {thief.name}, décidez si vous souhaitez voler le rôle de {eliminated.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTitle>{thiefRole.name}</AlertTitle>
          <AlertDescription>{thiefRole.ability}</AlertDescription>
        </Alert>

        <div className="rounded-lg border border-cyan-900/40 bg-slate-800/40 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cyan-200/80">Rôle éliminé</p>
              <p className="text-lg font-semibold text-cyan-100">{eliminatedRole.name}</p>
            </div>
            <Badge
              variant={
                eliminated.team === "civilians"
                  ? "default"
                  : eliminated.team === "undercovers"
                    ? "destructive"
                    : "outline"
              }
            >
              {getTeamLabel(eliminated.team)}
            </Badge>
          </div>
          <p className="mt-3 text-sm text-cyan-200/70 leading-relaxed">{eliminatedRole.description}</p>
          {eliminatedRole.ability && (
            <p className="mt-2 text-sm text-cyan-100/80">Capacité : {eliminatedRole.ability}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={onSkip}
          variant="outline"
          className="w-full border-cyan-900/60 text-cyan-200 hover:bg-slate-800/60"
        >
          Garder mon rôle de Voleur
        </Button>
        <Button
          onClick={onSteal}
          className="w-full bg-cyan-600 hover:bg-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/50"
        >
          Voler ce rôle
        </Button>
      </CardFooter>
    </Card>
  )
}

