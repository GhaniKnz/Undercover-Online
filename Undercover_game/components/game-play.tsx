"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import gameLogic from "@/lib/game-logic"
import type { GameState, Player } from "@/lib/game-logic"
import { WordReveal } from "./word-reveal"
import { TurnPhase } from "./turn-phase"
import { VotePhase } from "./vote-phase"
import { ResultsPhase } from "./results-phase"
import { MisterWhiteGuess } from "./mister-white-guess"

interface GamePlayProps {
  players: string[]
  includeMisterWhite: boolean
  useCustomWords?: boolean
  maxRounds?: number
}

export const GamePlay = ({ players, includeMisterWhite, useCustomWords = false, maxRounds = 2 }: GamePlayProps) => {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [showWord, setShowWord] = useState(false)
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null)
  const [misterWhiteGuessing, setMisterWhiteGuessing] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<"civilians" | "undercovers" | "mister-white" | null>(null)

  useEffect(() => {
    // Initialize game state
    const initialGameState = gameLogic.generateGameData(players, includeMisterWhite, useCustomWords, maxRounds)
    setGameState(initialGameState)
  }, [players, includeMisterWhite, useCustomWords, maxRounds])

  const handleNextPlayer = () => {
    if (!gameState) return

    if (currentPlayerIndex < gameState.players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1)
      setShowWord(false)
    } else {
      // All players have seen their roles, move to the first turn
      setGameState({
        ...gameState,
        phase: "turn",
        currentTurn: 0,
        turnOrder: [...Array(gameState.players.length).keys()].filter((i) => !gameState.players[i].eliminated),
      })
    }
  }

  const handleWordRevealComplete = () => {
    setShowWord(true)
  }

  const handleClueSubmitted = (clue: string) => {
    if (!gameState) return

    const updatedPlayers = [...gameState.players]
    updatedPlayers[gameState.turnOrder[gameState.currentTurn]].clues.push(clue)

    if (gameState.currentTurn < gameState.turnOrder.length - 1) {
      // Move to next player's turn
      setGameState({
        ...gameState,
        players: updatedPlayers,
        currentTurn: gameState.currentTurn + 1,
      })
    } else {
      // All players have given clues for this round
      // Check if we've reached the maximum number of rounds
      if (gameState.round >= gameState.maxRounds) {
        // Move to voting phase if we've completed all rounds
        setGameState({
          ...gameState,
          players: updatedPlayers,
          phase: "vote",
        })
      } else {
        // Start a new round of clues
        setGameState({
          ...gameState,
          players: updatedPlayers,
          round: gameState.round + 1,
          currentTurn: 0,
        })
      }
    }
  }

  const handleVoteComplete = (votedPlayerId: number) => {
    if (!gameState) return

    const eliminatedPlayer = gameState.players[votedPlayerId]
    setEliminatedPlayer(eliminatedPlayer)

    // Remove player from active players
    const updatedPlayers = gameState.players.map((player, index) =>
      index === votedPlayerId ? { ...player, eliminated: true } : player,
    )

    // Check if Mister White was eliminated
    if (eliminatedPlayer.role === "mister-white") {
      setMisterWhiteGuessing(true)
      setGameState({
        ...gameState,
        players: updatedPlayers,
        phase: "mister-white-guess",
      })
      return
    }

    // Check win conditions
    const activePlayers = updatedPlayers.filter((p) => !p.eliminated)
    const activeCivilians = activePlayers.filter((p) => p.role === "civilian")
    const activeUndercovers = activePlayers.filter((p) => p.role === "undercover")
    const activeMisterWhite = activePlayers.filter((p) => p.role === "mister-white")

    if (activeUndercovers.length === 0 && activeMisterWhite.length === 0) {
      // Civilians win
      setWinner("civilians")
      setGameOver(true)
    } else if (activeUndercovers.length >= activeCivilians.length) {
      // Undercovers win
      setWinner("undercovers")
      setGameOver(true)
    } else {
      // Continue to next round
      setGameState({
        ...gameState,
        players: updatedPlayers,
        phase: "turn",
        currentTurn: 0,
        turnOrder: activePlayers.map((p) => gameState.players.indexOf(p)),
        round: 1, // Reset round counter for new set of clues
      })
    }
  }

  const handleMisterWhiteGuess = (guess: string, correct: boolean) => {
    if (!gameState) return

    if (correct) {
      // Mister White wins
      setWinner("mister-white")
    } else {
      // Check remaining win conditions
      const activePlayers = gameState.players.filter((p) => !p.eliminated)
      const activeCivilians = activePlayers.filter((p) => p.role === "civilian")
      const activeUndercovers = activePlayers.filter((p) => p.role === "undercover")

      if (activeUndercovers.length === 0) {
        // Civilians win
        setWinner("civilians")
      } else if (activeUndercovers.length >= activeCivilians.length) {
        // Undercovers win
        setWinner("undercovers")
      } else {
        // Continue to next round
        setGameState({
          ...gameState,
          phase: "turn",
          currentTurn: 0,
          turnOrder: activePlayers.map((p) => gameState.players.indexOf(p)),
          round: 1, // Reset round counter for new set of clues
        })
        setMisterWhiteGuessing(false)
        return
      }
    }

    setGameOver(true)
  }

  const startNewGame = () => {
    const newGameState = gameLogic.generateGameData(players, includeMisterWhite, useCustomWords, maxRounds)
    setGameState(newGameState)
    setCurrentPlayerIndex(0)
    setShowWord(false)
    setEliminatedPlayer(null)
    setMisterWhiteGuessing(false)
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
            <CardTitle className="text-center text-cyan-300">Distribution des mots</CardTitle>
            <CardDescription className="text-center text-cyan-100">
              Passez le téléphone à chaque joueur pour qu'il découvre son mot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!showWord ? (
              <div className="text-center p-6">
                <h3 className="text-xl font-bold mb-4 text-cyan-200">Au tour de {currentPlayer.name}</h3>
                <p className="mb-6 text-cyan-100">Passez le téléphone à {currentPlayer.name}</p>
                <WordReveal
                  player={currentPlayer}
                  civilianWord={gameState.civilianWord}
                  undercoverWord={gameState.undercoverWord}
                  onComplete={handleWordRevealComplete}
                />
              </div>
            ) : (
              <div className="text-center p-6">
                <h3 className="text-xl font-bold mb-4 text-cyan-200">Mémorisez votre mot !</h3>
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
    const currentTurnPlayer = gameState.players[gameState.turnOrder[gameState.currentTurn]]

    return (
      <div className="w-full bg-game p-4 rounded-lg">
        <TurnPhase
          player={currentTurnPlayer}
          round={gameState.round}
          maxRounds={gameState.maxRounds}
          onClueSubmitted={handleClueSubmitted}
          players={gameState.players}
        />
      </div>
    )
  }

  if (gameState.phase === "vote") {
    return (
      <div className="w-full bg-game p-4 rounded-lg">
        <VotePhase
          players={gameState.players.filter((p) => !p.eliminated)}
          onVoteComplete={handleVoteComplete}
          eliminatedPlayer={eliminatedPlayer}
        />
      </div>
    )
  }

  if (gameState.phase === "mister-white-guess") {
    return (
      <div className="w-full bg-game p-4 rounded-lg">
        <MisterWhiteGuess
          player={eliminatedPlayer!}
          civilianWord={gameState.civilianWord}
          onGuessComplete={handleMisterWhiteGuess}
        />
      </div>
    )
  }

  return <div>État de jeu inconnu</div>
}
