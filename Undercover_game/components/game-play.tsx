"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import gameLogic, {
  type GameState,
  type InvestigationRecord,
  type Player,
  type PlayerRole,
  type SecretMessage,
} from "@/lib/game-logic"
import { WordReveal } from "./word-reveal"
import { TurnPhase } from "./turn-phase"
import { VotePhase } from "./vote-phase"
import { ResultsPhase } from "./results-phase"
import { MisterWhiteGuess } from "./mister-white-guess"
import { ThiefPhase } from "./thief-phase"

type Winner = "civilians" | "undercovers" | "mister-white" | "saboteur" | null

interface GamePlayProps {
  players: string[]
  includeMisterWhite: boolean
  optionalRoles?: PlayerRole[]
  useCustomWords?: boolean
  maxRounds?: number
}

const getActivePlayers = (players: Player[]) => players.filter((player) => !player.eliminated)

const determineWinner = (players: Player[]): Winner => {
  const activePlayers = getActivePlayers(players)

  if (activePlayers.length === 0) {
    return null
  }

  const civilians = activePlayers.filter((player) => player.team === "civilians")
  const undercovers = activePlayers.filter((player) => player.team === "undercovers")
  const misterWhite = activePlayers.filter((player) => player.role === "mister-white")

  if (activePlayers.length === misterWhite.length && misterWhite.length > 0) {
    return "mister-white"
  }

  if (undercovers.length === 0 && misterWhite.length === 0) {
    return "civilians"
  }

  if (civilians.length === 0 || undercovers.length >= civilians.length) {
    return "undercovers"
  }

  return null
}

export const GamePlay = ({
  players,
  includeMisterWhite,
  optionalRoles = [],
  useCustomWords = false,
  maxRounds = 2,
}: GamePlayProps) => {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [showWord, setShowWord] = useState(false)
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<Winner>(null)

  useEffect(() => {
    const initialGameState = gameLogic.generateGameData(players, {
      includeMisterWhite,
      optionalRoles,
      useCustomWords,
      maxRounds,
    })

    setGameState(initialGameState)
    setCurrentPlayerIndex(0)
    setShowWord(false)
    setEliminatedPlayer(null)
    setGameOver(false)
    setWinner(null)
  }, [players, includeMisterWhite, optionalRoles, useCustomWords, maxRounds])

  const handleNextPlayer = () => {
    if (!gameState) return

    if (currentPlayerIndex < gameState.players.length - 1) {
      setCurrentPlayerIndex((index) => index + 1)
      setShowWord(false)
    } else {
      setGameState({
        ...gameState,
        phase: "turn",
        currentTurn: 0,
        turnOrder: gameState.players.map((_, index) => index),
      })
    }
  }

  const handleWordRevealComplete = () => {
    setShowWord(true)
  }

  const handleClueSubmitted = (clue: string) => {
    if (!gameState) return

    const turnPlayerIndex = gameState.turnOrder[gameState.currentTurn]
    const updatedPlayers = gameState.players.map((player, index) =>
      index === turnPlayerIndex ? { ...player, clues: [...player.clues, clue] } : player,
    )

    if (gameState.currentTurn < gameState.turnOrder.length - 1) {
      setGameState({
        ...gameState,
        players: updatedPlayers,
        currentTurn: gameState.currentTurn + 1,
      })
    } else if (gameState.round >= gameState.maxRounds) {
      setGameState({
        ...gameState,
        players: updatedPlayers,
        phase: "vote",
      })
    } else {
      setGameState({
        ...gameState,
        players: updatedPlayers,
        round: gameState.round + 1,
        currentTurn: 0,
      })
    }
  }

  const handleAcknowledgeMessages = (playerIndex: number) => {
    if (!gameState) return
    if (!gameState.secretMessages.some((message) => message.to === playerIndex && !message.delivered)) return

    const updatedMessages = gameState.secretMessages.map((message) =>
      message.to === playerIndex ? { ...message, delivered: true } : message,
    )

    setGameState({
      ...gameState,
      secretMessages: updatedMessages,
    })
  }

  const handleDetectiveReveal = (investigatorIndex: number, targetIndex: number): PlayerRole | null => {
    if (!gameState) return null

    const investigator = gameState.players[investigatorIndex]
    if (!investigator.abilities.detectiveRevealAvailable) {
      return null
    }

    const updatedPlayers = gameState.players.map((player, index) =>
      index === investigatorIndex
        ? {
            ...player,
            abilities: { ...player.abilities, detectiveRevealAvailable: false },
          }
        : player,
    )

    const revealedRole = gameState.players[targetIndex].role

    const updatedInvestigations: InvestigationRecord[] = [
      ...gameState.investigations,
      { investigator: investigatorIndex, target: targetIndex, role: revealedRole },
    ]

    setGameState({
      ...gameState,
      players: updatedPlayers,
      investigations: updatedInvestigations,
    })

    return revealedRole
  }

  const handleSpyMessage = (fromIndex: number, toIndex: number, message: string) => {
    if (!gameState || !message.trim()) return false

    const spy = gameState.players[fromIndex]
    if (!spy.abilities.spyMessageAvailable) {
      return false
    }

    const updatedPlayers = gameState.players.map((player, index) =>
      index === fromIndex
        ? {
            ...player,
            abilities: { ...player.abilities, spyMessageAvailable: false },
          }
        : player,
    )

    const newMessage: SecretMessage = {
      id: gameState.nextMessageId,
      from: fromIndex,
      to: toIndex,
      message: message.trim(),
      delivered: false,
    }

    setGameState({
      ...gameState,
      players: updatedPlayers,
      secretMessages: [...gameState.secretMessages, newMessage],
      nextMessageId: gameState.nextMessageId + 1,
    })

    return true
  }

  const finalizeElimination = (state: GameState) => {
    const activePlayers = getActivePlayers(state.players)
    const saboteurAlive = activePlayers.some((player) => player.role === "saboteur")

    if (saboteurAlive && state.eliminationCount >= state.saboteurTargetRounds) {
      setWinner("saboteur")
      setGameOver(true)
      setGameState({ ...state, phase: "results" })
      return
    }

    const computedWinner = determineWinner(state.players)
    if (computedWinner) {
      setWinner(computedWinner)
      setGameOver(true)
      setGameState({ ...state, phase: "results" })
      return
    }

    setGameState({
      ...state,
      phase: "turn",
      currentTurn: 0,
      turnOrder: activePlayers.map((player) => state.players.indexOf(player)),
      round: 1,
      pendingThief: null,
    })
  }

  const handleVoteComplete = (votedPlayerId: number) => {
    if (!gameState) return

    const eliminated = gameState.players[votedPlayerId]
    const updatedPlayers = gameState.players.map((player, index) =>
      index === votedPlayerId ? { ...player, eliminated: true } : player,
    )

    const updatedState: GameState = {
      ...gameState,
      players: updatedPlayers,
      eliminationCount: gameState.eliminationCount + 1,
    }

    setEliminatedPlayer(updatedPlayers[votedPlayerId])

    const saboteurAlive = updatedPlayers.some((player) => player.role === "saboteur" && !player.eliminated)
    if (saboteurAlive && updatedState.eliminationCount >= updatedState.saboteurTargetRounds) {
      setWinner("saboteur")
      setGameOver(true)
      setGameState({ ...updatedState, phase: "results" })
      return
    }

    if (eliminated.role === "mister-white") {
      setGameState({ ...updatedState, phase: "mister-white-guess" })
      return
    }

    const thiefIndex = updatedPlayers.findIndex(
      (player) =>
        player.role === "thief" &&
        !player.eliminated &&
        player.abilities.thiefCanSteal &&
        !player.abilities.thiefHasStolen,
    )

    if (thiefIndex !== -1 && gameState.eliminationCount === 0) {
      setGameState({
        ...updatedState,
        phase: "thief-choice",
        pendingThief: { thiefIndex, eliminatedIndex: votedPlayerId },
      })
      return
    }

    finalizeElimination({ ...updatedState, pendingThief: null })
  }

  const handleThiefDecision = (shouldSteal: boolean) => {
    if (!gameState || !gameState.pendingThief) return

    const { thiefIndex, eliminatedIndex } = gameState.pendingThief
    const eliminated = gameState.players[eliminatedIndex]

    const updatedPlayers = gameState.players.map((player, index) => {
      if (index !== thiefIndex) {
        return player
      }

      if (!shouldSteal) {
        return {
          ...player,
          abilities: { ...player.abilities, thiefCanSteal: false, thiefHasStolen: false },
          metadata: {
            ...player.metadata,
            thiefOriginalRole: player.metadata.thiefOriginalRole ?? "thief",
          },
        }
      }

      const roleData = gameLogic.getRoleData(eliminated.role, {
        civilian: gameState.civilianWord,
        undercover: gameState.undercoverWord,
      }, { previousPlayer: player })

      return {
        ...player,
        role: eliminated.role,
        team: roleData.team,
        wordType: roleData.wordType,
        word: roleData.word,
        definition: roleData.definition,
        abilities: {
          ...roleData.abilities,
          thiefHasStolen: true,
          thiefCanSteal: false,
        },
        metadata: {
          ...player.metadata,
          ...roleData.metadata,
          thiefOriginalRole: player.metadata.thiefOriginalRole ?? "thief",
        },
      }
    })

    const updatedState: GameState = {
      ...gameState,
      players: updatedPlayers,
      pendingThief: null,
    }

    finalizeElimination(updatedState)
  }

  const handleMisterWhiteGuess = (guess: string, correct: boolean) => {
    if (!gameState) return

    if (correct) {
      setWinner("mister-white")
      setGameOver(true)
      setGameState({ ...gameState, phase: "results" })
      return
    }

    const updatedState: GameState = {
      ...gameState,
      phase: "turn",
      currentTurn: 0,
      turnOrder: getActivePlayers(gameState.players).map((player) => gameState.players.indexOf(player)),
      round: 1,
    }

    const computedWinner = determineWinner(updatedState.players)
    if (computedWinner) {
      setWinner(computedWinner)
      setGameOver(true)
      setGameState({ ...updatedState, phase: "results" })
    } else {
      setGameState(updatedState)
    }
  }

  const startNewGame = () => {
    const newGameState = gameLogic.generateGameData(players, {
      includeMisterWhite,
      optionalRoles,
      useCustomWords,
      maxRounds,
    })

    setGameState(newGameState)
    setCurrentPlayerIndex(0)
    setShowWord(false)
    setEliminatedPlayer(null)
    setGameOver(false)
    setWinner(null)
  }

  if (!gameState) {
    return <div>Chargement...</div>
  }

  if (gameOver) {
    return (
      <div className="w-full bg-game p-4 rounded-lg">
        <ResultsPhase
          winner={winner}
          players={gameState.players}
          civilianWord={gameState.civilianWord}
          undercoverWord={gameState.undercoverWord}
          onNewGame={startNewGame}
        />
      </div>
    )
  }

  if (gameState.phase === "setup") {
    const currentPlayer = gameState.players[currentPlayerIndex]

    return (
      <div className="w-full bg-game p-4 rounded-lg">
        <Card className="w-full bg-slate-900/70 backdrop-blur-sm card-neon">
          <CardHeader>
            <CardTitle className="text-center text-cyan-300">Distribution des rôles</CardTitle>
            <CardDescription className="text-center text-cyan-100">
              Passez le téléphone à chaque joueur pour découvrir son rôle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!showWord ? (
              <div className="text-center p-6">
                <h3 className="text-xl font-bold mb-4 text-cyan-200">Au tour de {currentPlayer.name}</h3>
                <p className="mb-6 text-cyan-100">Passez le téléphone à {currentPlayer.name}</p>
                <WordReveal player={currentPlayer} onComplete={handleWordRevealComplete} />
              </div>
            ) : (
              <div className="text-center p-6">
                <h3 className="text-xl font-bold mb-4 text-cyan-200">Mémorisez votre rôle</h3>
                <p className="mb-6 text-cyan-100">Passez le téléphone au joueur suivant quand vous êtes prêt.</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleNextPlayer}
              className="w-full bg-cyan-600 hover:bg-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/50"
              disabled={!showWord}
            >
              {currentPlayerIndex < gameState.players.length - 1 ? "Joueur suivant" : "Commencer la partie"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (gameState.phase === "turn") {
    const currentTurnPlayerIndex = gameState.turnOrder[gameState.currentTurn]
    const currentTurnPlayer = gameState.players[currentTurnPlayerIndex]

    return (
      <div className="w-full bg-game p-4 rounded-lg">
        <TurnPhase
          player={currentTurnPlayer}
          playerIndex={currentTurnPlayerIndex}
          round={gameState.round}
          players={gameState.players}
          investigations={gameState.investigations}
          secretMessages={gameState.secretMessages}
          onClueSubmitted={handleClueSubmitted}
          onAcknowledgeMessages={handleAcknowledgeMessages}
          onDetectiveReveal={handleDetectiveReveal}
          onSpyMessage={handleSpyMessage}
        />
      </div>
    )
  }

  if (gameState.phase === "vote") {
    return (
      <div className="w-full bg-game p-4 rounded-lg">
        <VotePhase
          players={gameState.players.filter((player) => !player.eliminated)}
          onVoteComplete={handleVoteComplete}
          eliminatedPlayer={eliminatedPlayer}
        />
      </div>
    )
  }

  if (gameState.phase === "thief-choice" && gameState.pendingThief && eliminatedPlayer) {
    const thief = gameState.players[gameState.pendingThief.thiefIndex]
    const eliminated = eliminatedPlayer

    return (
      <div className="w-full bg-game p-4 rounded-lg">
        <ThiefPhase thief={thief} eliminated={eliminated} onSteal={() => handleThiefDecision(true)} onSkip={() => handleThiefDecision(false)} />
      </div>
    )
  }

  if (gameState.phase === "mister-white-guess" && eliminatedPlayer) {
    return (
      <div className="w-full bg-game p-4 rounded-lg">
        <MisterWhiteGuess
          player={eliminatedPlayer}
          civilianWord={gameState.civilianWord}
          onGuessComplete={handleMisterWhiteGuess}
        />
      </div>
    )
  }

  return <div>État de jeu inconnu</div>
}

