import { OPTIONAL_ROLE_IDS, ROLE_DEFINITIONS } from "./roles"
import type { PlayerRole, RoleTeam, WordAssignment } from "./roles"

type GamePhase = "setup" | "turn" | "vote" | "mister-white-guess" | "thief-choice" | "results"

type PlayerWordType = "civilian" | "undercover" | "none" | "unique"

interface PlayerMetadata {
  chameleonWordType?: PlayerWordType
  thiefOriginalRole?: PlayerRole
}

interface PlayerAbilities {
  detectiveRevealAvailable?: boolean
  spyMessageAvailable?: boolean
  mute?: boolean
  thiefCanSteal?: boolean
  thiefHasStolen?: boolean
  saboteurTargetRounds?: number
}

interface SecretMessage {
  id: number
  from: number
  to: number
  message: string
  delivered: boolean
}

interface InvestigationRecord {
  investigator: number
  target: number
  role: PlayerRole
}

interface PendingThiefState {
  thiefIndex: number
  eliminatedIndex: number
}

interface Player {
  name: string
  role: PlayerRole
  eliminated: boolean
  clues: string[]
  wordType: PlayerWordType
  word?: string
  definition?: string
  team: RoleTeam
  abilities: PlayerAbilities
  metadata: PlayerMetadata
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
  maxRounds: number
  optionalRoles: PlayerRole[]
  secretMessages: SecretMessage[]
  investigations: InvestigationRecord[]
  nextMessageId: number
  eliminationCount: number
  saboteurTargetRounds: number
  pendingThief: PendingThiefState | null
}

interface GenerateGameOptions {
  includeMisterWhite?: boolean
  optionalRoles?: PlayerRole[]
  useCustomWords?: boolean
  maxRounds?: number
}

const SABOTEUR_DEFAULT_TARGET = ROLE_DEFINITIONS.saboteur.saboteurTargetRounds ?? 5

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

interface RoleData {
  team: RoleTeam
  wordType: PlayerWordType
  word?: string
  definition?: string
  abilities: PlayerAbilities
  metadata: PlayerMetadata
}

interface RoleDataOptions {
  previousPlayer?: Player
}

const getRoleData = (
  role: PlayerRole,
  words: { civilian: { word: string; definition: string }; undercover: { word: string; definition: string } },
  options: RoleDataOptions = {},
): RoleData => {
  const { previousPlayer } = options
  const metadata: PlayerMetadata = { ...previousPlayer?.metadata }
  const abilities: PlayerAbilities = {}

  let team: RoleTeam = ROLE_DEFINITIONS[role].team
  let wordType: PlayerWordType = "none"
  let word: string | undefined
  let definition: string | undefined

  const setWordFromAssignment = (assignment: WordAssignment) => {
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
      const previousType = previousPlayer?.metadata?.chameleonWordType
      const assignedType: PlayerWordType =
        previousType ?? (Math.random() < 0.5 ? "civilian" : "undercover")
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
      const saboteurInfo = ROLE_DEFINITIONS.saboteur.uniqueWord ?? {
        word: "Saboteur",
        definition: "Semer le doute et prolonger la partie aussi longtemps que possible.",
      }
      wordType = "unique"
      word = saboteurInfo.word
      definition = saboteurInfo.definition
      abilities.saboteurTargetRounds =
        previousPlayer?.abilities?.saboteurTargetRounds ??
        ROLE_DEFINITIONS.saboteur.saboteurTargetRounds ??
        SABOTEUR_DEFAULT_TARGET
      break
    }
    case "thief":
      setWordFromAssignment("none")
      abilities.thiefCanSteal = !previousPlayer?.abilities?.thiefHasStolen
      abilities.thiefHasStolen = previousPlayer?.abilities?.thiefHasStolen ?? false
      metadata.thiefOriginalRole = previousPlayer?.metadata?.thiefOriginalRole ?? "thief"
      break
    default:
      setWordFromAssignment(ROLE_DEFINITIONS[role].wordAssignment)
      break
  }

  return { team, wordType, word, definition, abilities, metadata }
}

const buildPlayer = (
  name: string,
  role: PlayerRole,
  words: { civilian: { word: string; definition: string }; undercover: { word: string; definition: string } },
): Player => {
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

const sanitizeOptionalRoles = (optionalRoles: PlayerRole[] = []) => {
  const filtered = optionalRoles.filter((role) => OPTIONAL_ROLE_IDS.includes(role))
  return Array.from(new Set(filtered))
}

const assignRoles = (
  playerCount: number,
  includeMisterWhite: boolean,
  optionalRoles: PlayerRole[],
): PlayerRole[] => {
  const roles: PlayerRole[] = []
  const numUndercovers = Math.max(1, Math.floor(playerCount / 3))

  for (let i = 0; i < numUndercovers; i += 1) {
    roles.push("undercover")
  }

  if (includeMisterWhite) {
    const undercoverIndex = roles.findIndex((role) => role === "undercover")
    if (undercoverIndex !== -1) {
      roles[undercoverIndex] = "mister-white"
    } else {
      roles.push("mister-white")
    }
  }

  while (roles.length < playerCount) {
    roles.push("civilian")
  }

  const replaceRole = (targetRole: PlayerRole, newRole: PlayerRole) => {
    const index = roles.findIndex((role) => role === targetRole)
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

const generateGameData = (
  playerNames: string[],
  options: GenerateGameOptions = {},
): GameState => {
  const { includeMisterWhite = false, optionalRoles = [], useCustomWords = false, maxRounds = 2 } = options

  const sanitizedOptionalRoles = sanitizeOptionalRoles(optionalRoles)
  const wordPair = getRandomWordPair([], useCustomWords)
  const roles = assignRoles(playerNames.length, includeMisterWhite, sanitizedOptionalRoles)

  const players = roles.map((role, index) => buildPlayer(playerNames[index], role, wordPair))

  const usedWords = [wordPair.civilian.word, wordPair.undercover.word]
  if (sanitizedOptionalRoles.includes("saboteur")) {
    const saboteurWord = ROLE_DEFINITIONS.saboteur.uniqueWord?.word
    if (saboteurWord) {
      usedWords.push(saboteurWord)
    }
  }

  return {
    players,
    civilianWord: wordPair.civilian,
    undercoverWord: wordPair.undercover,
    phase: "setup",
    round: 1,
    currentTurn: 0,
    turnOrder: [...Array(players.length).keys()],
    usedWords,
    maxRounds,
    optionalRoles: sanitizedOptionalRoles,
    secretMessages: [],
    investigations: [],
    nextMessageId: 1,
    eliminationCount: 0,
    saboteurTargetRounds: ROLE_DEFINITIONS.saboteur.saboteurTargetRounds ?? SABOTEUR_DEFAULT_TARGET,
    pendingThief: null,
  }
}

// Export tout dans un seul objet
const gameLogic = {
  generateGameData,
  generateSimilarWords,
  getRoleData,
}

// Export des types pour TypeScript
export type {
  GamePhase,
  PlayerWordType,
  PlayerMetadata,
  PlayerAbilities,
  SecretMessage,
  InvestigationRecord,
  PendingThiefState,
  Player,
  GameState,
  GenerateGameOptions,
}

export { ROLE_DEFINITIONS, OPTIONAL_ROLE_IDS }

export type { PlayerRole } from "./roles"

// Export par défaut de l'objet gameLogic
export default gameLogic

