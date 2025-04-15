// Types
type GamePhase = "setup" | "turn" | "vote" | "mister-white-guess" | "results"

type PlayerRole = "civilian" | "undercover" | "mister-white"

interface Player {
  name: string
  role: PlayerRole
  eliminated: boolean
  clues: string[]
}

interface GameState {
  players: Player[]
  civilianWord: { word: string; definition: string }
  undercoverWord: { word: string; definition: string }
  phase: GamePhase
  round: number
  currentTurn: number
  turnOrder: number[]
  usedWords: string[]
  maxRounds: number // Nombre maximum de tours d'indices
}

// Word pairs for the game (civilian word, undercover word)
const wordPairs = [
  {
    civilian: { word: "Plage", definition: "Étendue de sable ou de galets au bord de la mer" },
    undercover: { word: "Piscine", definition: "Bassin artificiel rempli d'eau pour la baignade" },
  },
  {
    civilian: { word: "Livre", definition: "Assemblage de feuilles imprimées contenant du texte" },
    undercover: { word: "Journal", definition: "Publication périodique relatant l'actualité" },
  },
  {
    civilian: { word: "Pomme", definition: "Fruit comestible de couleur rouge, verte ou jaune" },
    undercover: { word: "Poire", definition: "Fruit comestible à la chair juteuse et sucrée" },
  },
  {
    civilian: { word: "Voiture", definition: "Véhicule à quatre roues propulsé par un moteur" },
    undercover: { word: "Moto", definition: "Véhicule à deux roues propulsé par un moteur" },
  },
  {
    civilian: { word: "Chien", definition: "Animal domestique canin, souvent gardien ou compagnon" },
    undercover: { word: "Chat", definition: "Petit félin domestique, indépendant et chasseur" },
  },
  {
    civilian: { word: "Café", definition: "Boisson stimulante préparée à partir de grains torréfiés" },
    undercover: { word: "Thé", definition: "Boisson préparée par infusion de feuilles séchées" },
  },
  {
    civilian: { word: "Cinéma", definition: "Salle où l'on projette des films sur grand écran" },
    undercover: { word: "Théâtre", definition: "Lieu où l'on présente des spectacles vivants" },
  },
  {
    civilian: { word: "Avion", definition: "Aéronef plus lourd que l'air propulsé par des moteurs" },
    undercover: { word: "Hélicoptère", definition: "Aéronef à voilure tournante capable de vol stationnaire" },
  },
  {
    civilian: { word: "Pizza", definition: "Galette de pâte garnie de divers ingrédients et cuite au four" },
    undercover: { word: "Burger", definition: "Sandwich composé d'une galette de viande hachée" },
  },
  {
    civilian: { word: "Montagne", definition: "Relief élevé de la surface terrestre" },
    undercover: { word: "Colline", definition: "Relief de faible altitude, moins imposant qu'une montagne" },
  },
]

// Function to get custom word pairs from localStorage
const getCustomWordPairs = () => {
  if (typeof window === "undefined") return []

  try {
    const storedPairs = localStorage.getItem("customWordPairs")
    if (storedPairs) {
      return JSON.parse(storedPairs)
    }
  } catch (error) {
    console.error("Error loading custom word pairs:", error)
  }

  return []
}

// Function to get a random word pair that hasn't been used before
const getRandomWordPair = (usedWords: string[] = [], useCustomWords = false) => {
  // Combine default and custom word pairs if useCustomWords is true
  const allPairs = useCustomWords ? [...wordPairs, ...getCustomWordPairs()] : wordPairs

  const availablePairs = allPairs.filter(
    (pair) => !usedWords.includes(pair.civilian.word) && !usedWords.includes(pair.undercover.word),
  )

  if (availablePairs.length === 0) {
    // If all words have been used, reset and use any pair
    return allPairs[Math.floor(Math.random() * allPairs.length)]
  }

  return availablePairs[Math.floor(Math.random() * availablePairs.length)]
}

// Function to generate similar words (simulated AI)
const generateSimilarWords = (word: string) => {
  // This is a placeholder for an actual AI-based word generation
  // In a real implementation, this would call an API to get semantically similar words

  // For now, we'll use a simple mapping of related words
  const similarWordsMap: Record<string, string[]> = {
    plage: ["côte", "rivage", "bord de mer", "littoral"],
    piscine: ["bassin", "baignade", "spa", "étang"],
    livre: ["roman", "ouvrage", "bouquin", "publication"],
    journal: ["gazette", "quotidien", "périodique", "revue"],
    // Add more mappings as needed
  }

  const lowerWord = word.toLowerCase()
  if (lowerWord in similarWordsMap) {
    const similarWords = similarWordsMap[lowerWord]
    return similarWords[Math.floor(Math.random() * similarWords.length)]
  }

  // If no mapping exists, return the original word with a note
  return `${word} (similaire)`
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

const generateGameData = (
  playerNames: string[],
  includeMisterWhite: boolean,
  useCustomWords = false,
  maxRounds = 2, // Par défaut, 2 tours d'indices
): GameState => {
  // Get a random word pair
  const { civilian, undercover } = getRandomWordPair([], useCustomWords)

  // Create players with roles
  const players: Player[] = playerNames.map((name) => ({
    name,
    role: "civilian", // Default role, will be updated
    eliminated: false,
    clues: [],
  }))

  // Shuffle players to randomize roles
  const shuffledPlayers = shuffleArray(players)

  // Determine number of undercovers (about 1/3 of players, at least 1)
  const numUndercovers = Math.max(1, Math.floor(players.length / 3))

  // Assign roles
  let misterWhiteAssigned = false

  for (let i = 0; i < shuffledPlayers.length; i++) {
    if (i < numUndercovers) {
      // If Mister White is enabled and not yet assigned, assign it to the first undercover
      if (includeMisterWhite && !misterWhiteAssigned) {
        shuffledPlayers[i].role = "mister-white"
        misterWhiteAssigned = true
      } else {
        shuffledPlayers[i].role = "undercover"
      }
    } else {
      shuffledPlayers[i].role = "civilian"
    }
  }

  // Return the game state
  return {
    players: shuffledPlayers,
    civilianWord: civilian,
    undercoverWord: undercover,
    phase: "setup",
    round: 1,
    currentTurn: 0,
    turnOrder: [],
    usedWords: [civilian.word, undercover.word],
    maxRounds: maxRounds,
  }
}

// Export tout dans un seul objet
const gameLogic = {
  generateGameData,
  generateSimilarWords,
  // Ajouter d'autres fonctions si nécessaire
}

// Export des types pour TypeScript
export type { GamePhase, PlayerRole, Player, GameState }

// Export par défaut de l'objet gameLogic
export default gameLogic
