"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { InvestigationRecord, Player, PlayerRole, SecretMessage } from "@/lib/game-logic"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ROLE_DEFINITIONS } from "@/lib/game-logic"

interface TurnPhaseProps {
  player: Player
  playerIndex: number
  round: number
  players: Player[]
  investigations: InvestigationRecord[]
  secretMessages: SecretMessage[]
  onClueSubmitted: (clue: string) => void
  onAcknowledgeMessages: (playerIndex: number) => void
  onDetectiveReveal?: (investigatorIndex: number, targetIndex: number) => PlayerRole | null
  onSpyMessage?: (fromIndex: number, toIndex: number, message: string) => boolean
}

const getRoleLabel = (role: PlayerRole) => ROLE_DEFINITIONS[role]?.name ?? role

export const TurnPhase = ({
  player,
  playerIndex,
  round,
  players,
  investigations,
  secretMessages,
  onClueSubmitted,
  onAcknowledgeMessages,
  onDetectiveReveal,
  onSpyMessage,
}: TurnPhaseProps) => {
  const [clue, setClue] = useState("")
  const [ready, setReady] = useState(false)
  const [selectedInvestigationTarget, setSelectedInvestigationTarget] = useState<string>("")
  const [investigationFeedback, setInvestigationFeedback] = useState<string | null>(null)
  const [selectedSpyTarget, setSelectedSpyTarget] = useState<string>("")
  const [spyMessage, setSpyMessage] = useState("")
  const [spyFeedback, setSpyFeedback] = useState<string | null>(null)

  const knownInvestigations = useMemo(
    () => investigations.filter((investigation) => investigation.investigator === playerIndex),
    [investigations, playerIndex],
  )

  const incomingMessages = useMemo(
    () => secretMessages.filter((message) => message.to === playerIndex && !message.delivered),
    [secretMessages, playerIndex],
  )

  const undercoverTargets = useMemo(
    () =>
      players
        .map((target, index) => ({ target, index }))
        .filter(
          ({ target, index }) =>
            index !== playerIndex && target.team === "undercovers" && !target.eliminated,
        ),
    [players, playerIndex],
  )

  const handleSubmit = () => {
    if (clue.trim()) {
      onClueSubmitted(clue.trim())
      setClue("")
      setInvestigationFeedback(null)
      setSpyFeedback(null)
    }
  }

  const handleDetectiveAction = () => {
    if (!onDetectiveReveal || !selectedInvestigationTarget) {
      setInvestigationFeedback("Sélectionnez un joueur à enquêter.")
      return
    }

    const targetIndex = Number.parseInt(selectedInvestigationTarget, 10)
    const result = onDetectiveReveal(playerIndex, targetIndex)

    if (result) {
      const roleName = getRoleLabel(result)
      setInvestigationFeedback(`${players[targetIndex].name} est ${roleName}.`)
    } else {
      setInvestigationFeedback("Impossible d'enquêter pour le moment.")
    }
  }

  const handleSpyAction = () => {
    if (!onSpyMessage) return

    if (!selectedSpyTarget) {
      setSpyFeedback("Sélectionnez un destinataire.")
      return
    }

    if (!spyMessage.trim()) {
      setSpyFeedback("Rédigez un message avant de l'envoyer.")
      return
    }

    const targetIndex = Number.parseInt(selectedSpyTarget, 10)
    const success = onSpyMessage(playerIndex, targetIndex, spyMessage)
    if (success) {
      setSpyFeedback("Message secret envoyé !")
      setSpyMessage("")
    } else {
      setSpyFeedback("Impossible d'envoyer le message.")
    }
  }

  const renderAbilityNotes = () => {
    const notes: JSX.Element[] = []

    if (player.abilities.mute) {
      notes.push(
        <Alert key="mute" variant="default">
          <AlertTitle>Le Muet</AlertTitle>
          <AlertDescription>
            Donnez un indice sans parler : privilégiez les émoticônes, gestes ou expressions courtes.
          </AlertDescription>
        </Alert>,
      )
    }

    if (player.role === "saboteur") {
      notes.push(
        <Alert key="saboteur" variant="default">
          <AlertTitle>Objectif Saboteur</AlertTitle>
          <AlertDescription>
            Survivez pendant {player.abilities.saboteurTargetRounds ?? 5} éliminations pour gagner.
          </AlertDescription>
        </Alert>,
      )
    }

    if (player.role === "chameleon") {
      const infiltration = player.metadata.chameleonWordType === "undercover" ? "Undercover" : "Civils"
      notes.push(
        <Alert key="chameleon" variant="default">
          <AlertTitle>Camouflage</AlertTitle>
          <AlertDescription>
            Votre infiltration actuelle : {infiltration}. Adaptez vos indices à ce camp !
          </AlertDescription>
        </Alert>,
      )
    }

    return notes.length > 0 ? <div className="space-y-3">{notes}</div> : null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          Tour {round} - {player.name}
        </CardTitle>
        <CardDescription>Donnez un indice sur votre mot sans être trop évident</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!ready ? (
          <div className="text-center p-6">
            <h3 className="text-xl font-bold mb-4">Au tour de {player.name}</h3>
            <p className="mb-6">Passez le téléphone à {player.name}</p>
            <Button onClick={() => setReady(true)}>Je suis {player.name}</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {incomingMessages.length > 0 && (
                <Alert>
                  <AlertTitle>Message secret</AlertTitle>
                  <AlertDescription className="space-y-2">
                    {incomingMessages.map((message) => (
                      <div key={message.id} className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          De {players[message.from].name}
                        </p>
                        <p className="font-medium">{message.message}</p>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => onAcknowledgeMessages(playerIndex)}
                      className="mt-2 border-cyan-900/60 text-cyan-200 hover:bg-slate-800/60"
                    >
                      Cacher le message
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {renderAbilityNotes()}

              {player.abilities.detectiveRevealAvailable && onDetectiveReveal && (
                <div className="space-y-2 rounded-lg border border-cyan-900/40 bg-slate-50 p-3 dark:bg-slate-900/60">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Pouvoir du Détective</h4>
                    <Badge variant="outline" className="text-xs">
                      1 utilisation
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choisissez un joueur pour découvrir secrètement son rôle.
                  </p>
                  <Select value={selectedInvestigationTarget} onValueChange={setSelectedInvestigationTarget}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un joueur" />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((candidate, index) =>
                        index !== playerIndex ? (
                          <SelectItem key={candidate.name} value={String(index)}>
                            {candidate.name}
                          </SelectItem>
                        ) : null,
                      )}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleDetectiveAction} className="w-full">
                    Enquêter
                  </Button>
                  {investigationFeedback && (
                    <p className="text-sm text-cyan-200/80">{investigationFeedback}</p>
                  )}
                  {knownInvestigations.length > 0 && (
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p className="font-medium text-cyan-100">Rôles découverts :</p>
                      {knownInvestigations.map((investigation) => (
                        <p key={`${investigation.target}-${investigation.role}`}>
                          {players[investigation.target].name} : {getRoleLabel(investigation.role)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {player.abilities.spyMessageAvailable && onSpyMessage && (
                <div className="space-y-2 rounded-lg border border-cyan-900/40 bg-slate-50 p-3 dark:bg-slate-900/60">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Message secret d'Espion</h4>
                    <Badge variant="outline" className="text-xs">
                      Unique
                    </Badge>
                  </div>
                  {undercoverTargets.length > 0 ? (
                    <>
                      <Select value={selectedSpyTarget} onValueChange={setSelectedSpyTarget}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisissez un complice" />
                        </SelectTrigger>
                        <SelectContent>
                          {undercoverTargets.map(({ target, index }) => (
                            <SelectItem key={target.name} value={String(index)}>
                              {target.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        value={spyMessage}
                        onChange={(event) => setSpyMessage(event.target.value)}
                        placeholder="Écrivez votre message secret"
                        rows={3}
                      />
                      <Button onClick={handleSpyAction} className="w-full">
                        Envoyer
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Aucun autre Undercover n'est disponible pour recevoir un message.
                    </p>
                  )}
                  {spyFeedback && <p className="text-sm text-cyan-200/80">{spyFeedback}</p>}
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Indices précédents :</h3>
                <ScrollArea className="h-48 border rounded-md p-2">
                  {players.some((participant) => participant.clues.length > 0) ? (
                    <div className="space-y-3">
                      {players.map((participant, index) =>
                        participant.clues.length > 0 ? (
                          <div key={participant.name} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{participant.name}</span>
                              {participant.eliminated && (
                                <Badge variant="outline" className="text-xs">
                                  Éliminé
                                </Badge>
                              )}
                            </div>
                            <div className="pl-4 space-y-1">
                              {participant.clues.map((participantClue, clueIndex) => (
                                <div key={`${participant.name}-${clueIndex}`} className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
                                  {participantClue}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null,
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun indice donné pour l'instant
                    </p>
                  )}
                </ScrollArea>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Votre indice :</h3>
              <Input
                placeholder="Entrez votre indice..."
                value={clue}
                onChange={(event) => setClue(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSubmit()}
              />
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        {ready && (
          <Button onClick={handleSubmit} className="w-full" disabled={!clue.trim()}>
            Valider mon indice
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

