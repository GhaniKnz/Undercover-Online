const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")
const path = require("path")

// Charger les variables d'environnement en développement
if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config()
  } catch (e) {
    console.log("dotenv n'est pas installé, les variables d'environnement doivent être définies manuellement")
  }
}

const app = express()
app.use(cors())

// Route de base pour vérifier que le serveur fonctionne
app.get("/", (req, res) => {
  res.send({
    status: "ok",
    message: "Undercover Game Server is running",
    timestamp: new Date().toISOString(),
  })
})

// Route de santé pour Render
app.get("/health", (req, res) => {
  res.status(200).send("OK")
})

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Structure pour stocker les données des salles de jeu
const gameRooms = {}

// Gestion des connexions Socket.IO
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`)

  // Créer une nouvelle salle de jeu
  socket.on("create_room", (callback) => {
    const roomId = generateRoomId()
    gameRooms[roomId] = {
      players: [],
      gameState: null,
      settings: {
        includeMisterWhite: false,
        useCustomWords: false,
        maxRounds: 2,
        optionalRoles: [],
      },
    }

    callback({ success: true, roomId })
  })

  // Rejoindre une salle de jeu
  socket.on("join_room", ({ roomId, playerName }, callback) => {
    // Vérifier si la salle existe
    if (!gameRooms[roomId]) {
      callback({ success: false, message: "Cette salle n'existe pas" })
      return
    }

    // Vérifier si le nom est déjà pris
    if (gameRooms[roomId].players.some((p) => p.name === playerName)) {
      callback({ success: false, message: "Ce nom est déjà pris" })
      return
    }

    // Ajouter le joueur à la salle
    const player = {
      id: socket.id,
      name: playerName,
      isHost: gameRooms[roomId].players.length === 0, // Premier joueur = hôte
      ready: false,
    }

    gameRooms[roomId].players.push(player)
    socket.join(roomId)

    // Informer tous les joueurs de la salle
    io.to(roomId).emit("players_update", gameRooms[roomId].players)

    callback({
      success: true,
      players: gameRooms[roomId].players,
      isHost: player.isHost,
    })
  })

  // Mettre à jour les paramètres du jeu (hôte uniquement)
  socket.on("update_settings", ({ roomId, settings }, callback) => {
    if (!gameRooms[roomId]) {
      callback({ success: false, message: "Salle introuvable" })
      return
    }

    const player = gameRooms[roomId].players.find((p) => p.id === socket.id)
    if (!player || !player.isHost) {
      callback({ success: false, message: "Seul l'hôte peut modifier les paramètres" })
      return
    }

    const mergedSettings = {
      ...gameRooms[roomId].settings,
      ...settings,
    }

    if (Array.isArray(settings.optionalRoles)) {
      mergedSettings.optionalRoles = sanitizeOptionalRoles(settings.optionalRoles)
    }

    gameRooms[roomId].settings = mergedSettings

    io.to(roomId).emit("settings_updated", gameRooms[roomId].settings)
    callback({ success: true })
  })

  // Marquer un joueur comme prêt
  socket.on("player_ready", ({ roomId }, callback) => {
    if (!gameRooms[roomId]) {
      callback({ success: false })
      return
    }

    const playerIndex = gameRooms[roomId].players.findIndex((p) => p.id === socket.id)
    if (playerIndex !== -1) {
      gameRooms[roomId].players[playerIndex].ready = true
      io.to(roomId).emit("players_update", gameRooms[roomId].players)
      callback({ success: true })
    }
  })

  // Démarrer la partie (hôte uniquement)
  socket.on("start_game", ({ roomId }, callback) => {
    if (!gameRooms[roomId]) {
      callback({ success: false, message: "Salle introuvable" })
      return
    }

    const player = gameRooms[roomId].players.find((p) => p.id === socket.id)
    if (!player || !player.isHost) {
      callback({ success: false, message: "Seul l'hôte peut démarrer la partie" })
      return
    }

    if (gameRooms[roomId].players.length < 3) {
      callback({ success: false, message: "Il faut au moins 3 joueurs pour commencer" })
      return
    }

    // Initialiser l'état du jeu
    const playerNames = gameRooms[roomId].players.map((p) => p.name)
    const { includeMisterWhite, useCustomWords, maxRounds, optionalRoles } = gameRooms[roomId].settings

    // Générer l'état du jeu (similaire à ta fonction generateGameData)
    const gameState = generateGameState(
      playerNames,
      includeMisterWhite,
      useCustomWords,
      maxRounds,
      optionalRoles,
    )
    gameRooms[roomId].gameState = gameState

    // Envoyer l'état initial à tous les joueurs
    io.to(roomId).emit("game_started", { gameState: sanitizeGameState(gameState) })

    // Envoyer les informations privées à chaque joueur
    gameRooms[roomId].players.forEach((player, index) => {
      const privateInfo = {
        role: gameState.players[index].role,
        word: getPlayerWord(gameState, index),
        definition: getPlayerDefinition(gameState, index),
      }

      io.to(player.id).emit("private_game_info", privateInfo)
    })

    callback({ success: true })
  })

  // Soumettre un indice
  socket.on("submit_clue", ({ roomId, clue }, callback) => {
    if (!gameRooms[roomId] || !gameRooms[roomId].gameState) {
      callback({ success: false })
      return
    }

    const gameState = gameRooms[roomId].gameState
    if (gameState.phase !== "turn") {
      callback({ success: false, message: "Ce n'est pas la phase d'indices" })
      return
    }

    const playerIndex = gameRooms[roomId].players.findIndex((p) => p.id === socket.id)
    const currentTurnPlayerIndex = gameState.turnOrder[gameState.currentTurn]

    if (playerIndex !== currentTurnPlayerIndex) {
      callback({ success: false, message: "Ce n'est pas votre tour" })
      return
    }

    // Ajouter l'indice
    gameState.players[playerIndex].clues.push(clue)

    // Passer au joueur suivant ou à la phase de vote
    if (gameState.currentTurn < gameState.turnOrder.length - 1) {
      gameState.currentTurn++
    } else {
      if (gameState.round >= gameState.maxRounds) {
        gameState.phase = "vote"
      } else {
        gameState.round++
        gameState.currentTurn = 0
      }
    }

    // Informer tous les joueurs
    io.to(roomId).emit("game_updated", { gameState: sanitizeGameState(gameState) })
    callback({ success: true })
  })

  // Voter pour éliminer un joueur
  socket.on("vote", ({ roomId, votedPlayerId }, callback) => {
    if (!gameRooms[roomId] || !gameRooms[roomId].gameState) {
      callback({ success: false })
      return
    }

    const gameState = gameRooms[roomId].gameState
    if (gameState.phase !== "vote") {
      callback({ success: false, message: "Ce n'est pas la phase de vote" })
      return
    }

    // Traiter le vote (similaire à ta fonction handleVoteComplete)
    const eliminatedPlayer = gameState.players[votedPlayerId]
    gameState.players[votedPlayerId].eliminated = true
    gameState.eliminationCount = (gameState.eliminationCount || 0) + 1
    gameState.eliminatedPlayerId = votedPlayerId

    const saboteurAlive = gameState.players.some(
      (player) => player.role === "saboteur" && !player.eliminated,
    )
    const saboteurTarget = gameState.saboteurTargetRounds || SABOTEUR_DEFAULT_TARGET

    if (saboteurAlive && gameState.eliminationCount >= saboteurTarget) {
      gameState.phase = "results"
      gameState.winner = "saboteur"
      gameState.pendingThief = null
    } else if (eliminatedPlayer.role === "mister-white") {
      gameState.phase = "mister-white-guess"
      gameState.pendingThief = null
    } else {
      const thiefIndex = gameState.players.findIndex(
        (player) =>
          player.role === "thief" &&
          !player.eliminated &&
          player.abilities &&
          player.abilities.thiefCanSteal &&
          !player.abilities.thiefHasStolen,
      )

      const isFirstElimination = gameState.eliminationCount === 1

      if (thiefIndex !== -1 && isFirstElimination) {
        gameState.phase = "thief-choice"
        gameState.pendingThief = { thiefIndex, eliminatedIndex: votedPlayerId }
      } else {
        const result = checkWinConditions(gameState)
        if (result.gameOver) {
          gameState.phase = "results"
          gameState.winner = result.winner
          gameState.pendingThief = null
        } else {
          gameState.phase = "turn"
          gameState.round = 1
          gameState.currentTurn = 0
          gameState.turnOrder = gameState.players
            .map((p, i) => (p.eliminated ? -1 : i))
            .filter((i) => i !== -1)
          gameState.pendingThief = null
          gameState.eliminatedPlayerId = null
          gameState.winner = null
        }
      }
    }

    // Informer tous les joueurs
    io.to(roomId).emit("game_updated", {
      gameState: sanitizeGameState(gameState),
      eliminatedPlayer: {
        name: eliminatedPlayer.name,
        role: eliminatedPlayer.role,
      },
    })

    callback({ success: true })
  })

  // Mister White devine le mot
  socket.on("mister_white_guess", ({ roomId, guess }, callback) => {
    if (!gameRooms[roomId] || !gameRooms[roomId].gameState) {
      callback({ success: false })
      return
    }

    const gameState = gameRooms[roomId].gameState
    if (gameState.phase !== "mister-white-guess") {
      callback({ success: false })
      return
    }

    const playerIndex = gameRooms[roomId].players.findIndex((p) => p.id === socket.id)
    if (playerIndex !== gameState.eliminatedPlayerId) {
      callback({ success: false, message: "Vous n'êtes pas le Mister White éliminé" })
      return
    }

    // Vérifier si la réponse est correcte
    const isCorrect = guess.toLowerCase() === gameState.civilianWord.word.toLowerCase()

    if (isCorrect) {
      gameState.phase = "results"
      gameState.winner = "mister-white"
    } else {
      // Vérifier les conditions de victoire
      const result = checkWinConditions(gameState)
      if (result.gameOver) {
        gameState.phase = "results"
        gameState.winner = result.winner
      } else {
        // Continuer au prochain tour
        gameState.phase = "turn"
        gameState.round = 1
        gameState.currentTurn = 0
        gameState.turnOrder = gameState.players.map((p, i) => (p.eliminated ? -1 : i)).filter((i) => i !== -1)
        gameState.pendingThief = null
        gameState.eliminatedPlayerId = null
        gameState.winner = null
      }
    }

    // Informer tous les joueurs
    io.to(roomId).emit("game_updated", {
      gameState: sanitizeGameState(gameState),
      misterWhiteGuess: {
        guess,
        isCorrect,
      },
    })

    callback({ success: true })
  })

  // Déconnexion
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`)

    // Trouver et nettoyer les salles où le joueur était présent
    Object.keys(gameRooms).forEach((roomId) => {
      const playerIndex = gameRooms[roomId].players.findIndex((p) => p.id === socket.id)

      if (playerIndex !== -1) {
        const wasHost = gameRooms[roomId].players[playerIndex].isHost
        gameRooms[roomId].players.splice(playerIndex, 1)

        // Si la salle est vide, la supprimer
        if (gameRooms[roomId].players.length === 0) {
          delete gameRooms[roomId]
          return
        }

        // Si l'hôte est parti, désigner un nouvel hôte
        if (wasHost) {
          gameRooms[roomId].players[0].isHost = true
        }

        // Informer les autres joueurs
        io.to(roomId).emit("players_update", gameRooms[roomId].players)

        // Si une partie est en cours, gérer le départ du joueur
        if (gameRooms[roomId].gameState) {
          // Logique pour gérer le départ d'un joueur pendant la partie
          // (marquer comme éliminé, vérifier conditions de victoire, etc.)
        }
      }
    })
  })
})

// Fonctions utilitaires
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function sanitizeGameState(gameState) {
  // Créer une copie sans les informations sensibles (mots, rôles)
  const sanitized = JSON.parse(JSON.stringify(gameState))

  // Supprimer les informations privées
  sanitized.players = sanitized.players.map((player) => ({
    ...player,
    role: undefined,
    word: undefined,
    definition: undefined,
    abilities: undefined,
    metadata: undefined,
    wordType: undefined,
  }))

  return sanitized
}

function getPlayerWord(gameState, playerIndex) {
  const player = gameState.players[playerIndex]
  if (player.word) return player.word
  if (player.role === "mister-white") return "Aucun mot"
  if (player.role === "thief") return "En attente"
  return "Aucun mot"
}

function getPlayerDefinition(gameState, playerIndex) {
  const player = gameState.players[playerIndex]
  if (player.definition) return player.definition
  if (player.role === "mister-white") {
    return "Vous devez deviner le mot des autres joueurs"
  }
  if (player.role === "thief") {
    return "Volez un rôle pour découvrir votre nouveau mot."
  }
  return "Pas de définition disponible"
}

const OPTIONAL_ROLE_IDS = ["detective", "spy", "mute", "chameleon", "saboteur", "thief"]

const ROLE_DEFINITIONS = {
  civilian: {
    team: "civilians",
    wordAssignment: "civilian",
    ability: null,
  },
  undercover: {
    team: "undercovers",
    wordAssignment: "undercover",
    ability: null,
  },
  "mister-white": {
    team: "neutral",
    wordAssignment: "none",
    ability: "Deviner le mot des civils pour gagner.",
  },
  detective: {
    team: "civilians",
    wordAssignment: "civilian",
    ability: "Peut enquêter une fois par partie.",
  },
  spy: {
    team: "undercovers",
    wordAssignment: "undercover",
    ability: "Peut envoyer un message secret à un Undercover.",
  },
  mute: {
    team: "civilians",
    wordAssignment: "civilian",
    ability: "Ne peut communiquer que par expressions non verbales.",
  },
  chameleon: {
    team: "neutral",
    wordAssignment: "civilian",
    ability: "Reçoit aléatoirement le mot des civils ou des Undercover.",
  },
  saboteur: {
    team: "neutral",
    wordAssignment: "unique",
    ability: "Gagne si la partie dure suffisamment longtemps.",
    uniqueWord: {
      word: "???",
      definition: "Brouillez les pistes sans révéler votre absence de mot concret.",
    },
    saboteurTargetRounds: 5,
  },
  thief: {
    team: "neutral",
    wordAssignment: "none",
    ability: "Peut voler le rôle d'un joueur éliminé lors de la première manche.",
  },
}

const SABOTEUR_DEFAULT_TARGET = ROLE_DEFINITIONS.saboteur.saboteurTargetRounds || 5

function sanitizeOptionalRoles(optionalRoles = []) {
  return Array.from(new Set(optionalRoles.filter((role) => OPTIONAL_ROLE_IDS.includes(role))))
}

function assignRoles(playerCount, includeMisterWhite, optionalRoles) {
  const roles = []
  const numUndercovers = Math.max(1, Math.floor(playerCount / 3))

  for (let i = 0; i < numUndercovers; i++) {
    roles.push("undercover")
  }

  if (includeMisterWhite) {
    const undercoverIndex = roles.indexOf("undercover")
    if (undercoverIndex !== -1) {
      roles[undercoverIndex] = "mister-white"
    } else {
      roles.push("mister-white")
    }
  }

  while (roles.length < playerCount) {
    roles.push("civilian")
  }

  const replaceRole = (targetRole, newRole) => {
    const index = roles.indexOf(targetRole)
    if (index !== -1) {
      roles[index] = newRole
      return true
    }
    return false
  }

  optionalRoles.forEach((role) => {
    switch (role) {
      case "spy":
        if (!replaceRole("undercover", role)) {
          replaceRole("civilian", role)
        }
        break
      case "detective":
      case "mute":
      case "chameleon":
      case "saboteur":
      case "thief":
        replaceRole("civilian", role)
        break
      default:
        break
    }
  })

  return shuffleArray(roles)
}

function getRoleData(role, words, previousPlayer = {}) {
  const metadata = { ...(previousPlayer.metadata || {}) }
  const abilities = {}

  let team = ROLE_DEFINITIONS[role].team
  let wordType = "none"
  let word
  let definition

  const setWordFromAssignment = (assignment) => {
    if (assignment === "civilian") {
      wordType = "civilian"
      word = words.civilian.word
      definition = words.civilian.definition
    } else if (assignment === "undercover") {
      wordType = "undercover"
      word = words.undercover.word
      definition = words.undercover.definition
    } else if (assignment === "none") {
      wordType = "none"
      word = undefined
      definition = undefined
    }
  }

  switch (role) {
    case "civilian":
      setWordFromAssignment("civilian")
      break
    case "undercover":
      setWordFromAssignment("undercover")
      break
    case "mister-white":
      setWordFromAssignment("none")
      break
    case "detective":
      setWordFromAssignment("civilian")
      abilities.detectiveRevealAvailable = true
      break
    case "spy":
      setWordFromAssignment("undercover")
      abilities.spyMessageAvailable = true
      break
    case "mute":
      setWordFromAssignment("civilian")
      abilities.mute = true
      break
    case "chameleon": {
      const assignedType = metadata.chameleonWordType || (Math.random() < 0.5 ? "civilian" : "undercover")
      metadata.chameleonWordType = assignedType
      if (assignedType === "civilian") {
        setWordFromAssignment("civilian")
        team = "civilians"
      } else {
        setWordFromAssignment("undercover")
        team = "undercovers"
      }
      break
    }
    case "saboteur": {
      wordType = "unique"
      word = ROLE_DEFINITIONS.saboteur.uniqueWord?.word || "???"
      definition =
        ROLE_DEFINITIONS.saboteur.uniqueWord?.definition ||
        "Brouillez les pistes et prolongez la partie aussi longtemps que possible."
      abilities.saboteurTargetRounds =
        previousPlayer.abilities?.saboteurTargetRounds ||
        ROLE_DEFINITIONS.saboteur.saboteurTargetRounds ||
        SABOTEUR_DEFAULT_TARGET
      break
    }
    case "thief":
      setWordFromAssignment("none")
      abilities.thiefCanSteal = !previousPlayer.abilities?.thiefHasStolen
      abilities.thiefHasStolen = previousPlayer.abilities?.thiefHasStolen || false
      metadata.thiefOriginalRole = previousPlayer.metadata?.thiefOriginalRole || "thief"
      break
    default:
      setWordFromAssignment(ROLE_DEFINITIONS[role].wordAssignment)
      break
  }

  return { team, wordType, word, definition, abilities, metadata }
}

function buildPlayer(name, role, words) {
  const roleData = getRoleData(role, words)
  return {
    name,
    role,
    eliminated: false,
    clues: [],
    wordType: roleData.wordType,
    word: roleData.word,
    definition: roleData.definition,
    team: roleData.team,
    abilities: roleData.abilities,
    metadata: roleData.metadata,
  }
}

function checkWinConditions(gameState) {
  const activePlayers = gameState.players.filter((p) => !p.eliminated)
  const activeCivilians = activePlayers.filter((p) => p.team === "civilians")
  const activeUndercovers = activePlayers.filter((p) => p.team === "undercovers")
  const activeMisterWhite = activePlayers.filter((p) => p.role === "mister-white")
  const saboteurAlive = activePlayers.some((p) => p.role === "saboteur")

  if (saboteurAlive && gameState.eliminationCount >= gameState.saboteurTargetRounds) {
    return { gameOver: true, winner: "saboteur" }
  }

  if (activePlayers.length === activeMisterWhite.length && activeMisterWhite.length > 0) {
    return { gameOver: true, winner: "mister-white" }
  }

  if (activeUndercovers.length === 0 && activeMisterWhite.length === 0) {
    return { gameOver: true, winner: "civilians" }
  }

  if (activeCivilians.length === 0 || activeUndercovers.length >= activeCivilians.length) {
    return { gameOver: true, winner: "undercovers" }
  }

  return { gameOver: false }
}

function generateGameState(playerNames, includeMisterWhite, useCustomWords, maxRounds, optionalRoles = []) {
  const sanitizedOptionalRoles = sanitizeOptionalRoles(optionalRoles)
  const wordPair = getRandomWordPair(useCustomWords)
  const roles = assignRoles(playerNames.length, includeMisterWhite, sanitizedOptionalRoles)
  const players = roles.map((role, index) => buildPlayer(playerNames[index], role, wordPair))

  return {
    players,
    civilianWord: wordPair.civilian,
    undercoverWord: wordPair.undercover,
    phase: "setup",
    round: 1,
    currentTurn: 0,
    turnOrder: [...Array(players.length).keys()],
    maxRounds,
    optionalRoles: sanitizedOptionalRoles,
    secretMessages: [],
    investigations: [],
    nextMessageId: 1,
    eliminationCount: 0,
    saboteurTargetRounds: ROLE_DEFINITIONS.saboteur.saboteurTargetRounds || SABOTEUR_DEFAULT_TARGET,
    pendingThief: null,
    usedWords: [wordPair.civilian.word, wordPair.undercover.word],
    winner: null,
    eliminatedPlayerId: null,
  }
}

function shuffleArray(array) {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

function getRandomWordPair(useCustomWords) {
  // Similaire à ta fonction getRandomWordPair
  // Mais adaptée pour le serveur

  // Pour l'exemple, on retourne une paire fixe
  return {
    civilian: { word: "Plage", definition: "Étendue de sable ou de galets au bord de la mer" },
    undercover: { word: "Piscine", definition: "Bassin artificiel rempli d'eau pour la baignade" },
  }
}

// Démarrer le serveur
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Gestion des erreurs non capturées
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
})
