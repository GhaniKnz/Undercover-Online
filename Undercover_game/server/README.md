# Undercover Game Server

Serveur Socket.IO pour le jeu Undercover multijoueur.

## Configuration pour Render

### Déploiement manuel

1. Créez un nouveau Web Service sur Render
2. Connectez votre dépôt GitHub
3. Configurez les paramètres suivants:
   - **Name**: undercover-game-server
   - **Root Directory**: server
   - **Runtime**: Node
   - **Build Command**: npm install
   - **Start Command**: npm start
4. Ajoutez les variables d'environnement:
   - `PORT`: 10000 (Render utilise ce port par défaut)
   - `FRONTEND_URL`: URL de votre frontend (ex: https://undercover-game.vercel.app)
5. Cliquez sur "Create Web Service"

### Déploiement avec Blueprint

Si vous avez inclus le fichier `render.yaml` à la racine de votre projet, vous pouvez utiliser le bouton "Deploy to Render" pour déployer automatiquement.

## Variables d'environnement

- `PORT`: Port sur lequel le serveur écoute (par défaut: 3001)
- `FRONTEND_URL`: URL de votre frontend pour la configuration CORS

## Développement local

1. Copiez `.env.example` vers `.env`
2. Installez les dépendances: `npm install`
3. Démarrez le serveur: `npm run dev`
\`\`\`

### 5. Mise à jour du fichier index.js pour une meilleure compatibilité avec Render

```js file="server/index.js"
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

  // Le reste du code Socket.IO reste inchangé...
  // ...

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
      }
    })
  })
})

// Fonctions utilitaires
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
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
