export type PlayerRole =
  | "civilian"
  | "undercover"
  | "mister-white"
  | "detective"
  | "spy"
  | "mute"
  | "chameleon"
  | "saboteur"
  | "thief"

export type RoleTeam = "civilians" | "undercovers" | "neutral"

export type WordAssignment = "civilian" | "undercover" | "none" | "unique"

export interface RoleDefinition {
  id: PlayerRole
  name: string
  description: string
  team: RoleTeam
  wordAssignment: WordAssignment
  ability?: string
  uniqueWord?: { word: string; definition: string }
  saboteurTargetRounds?: number
}

export const ROLE_DEFINITIONS: Record<PlayerRole, RoleDefinition> = {
  civilian: {
    id: "civilian",
    name: "Citoyen",
    description: "Trouver les Undercover et Mister White en collaborant avec les autres joueurs.",
    team: "civilians",
    wordAssignment: "civilian",
  },
  undercover: {
    id: "undercover",
    name: "Undercover",
    description: "Se fondre parmi les civils et les éliminer sans se faire repérer.",
    team: "undercovers",
    wordAssignment: "undercover",
  },
  "mister-white": {
    id: "mister-white",
    name: "Mister White",
    description: "Deviner le mot des civils ou être le dernier joueur éliminé.",
    team: "neutral",
    wordAssignment: "none",
    ability: "Peut tenter de deviner le mot des civils à tout moment pour gagner instantanément.",
  },
  detective: {
    id: "detective",
    name: "Détective",
    description: "Aider les civils en enquêtant sur un joueur par partie.",
    team: "civilians",
    wordAssignment: "civilian",
    ability: "Une fois par partie, choisissez un joueur pour découvrir secrètement son rôle.",
  },
  spy: {
    id: "spy",
    name: "Espion",
    description: "Supporter les Undercover et partager un message secret.",
    team: "undercovers",
    wordAssignment: "undercover",
    ability: "Une fois par partie, envoyez un message secret à un autre Undercover.",
  },
  mute: {
    id: "mute",
    name: "Le Muet",
    description: "Citoyen spécial qui ne peut communiquer que par gestes ou émojis.",
    team: "civilians",
    wordAssignment: "civilian",
    ability: "Donnez vos indices uniquement sous forme d'émojis ou d'expressions non verbales.",
  },
  chameleon: {
    id: "chameleon",
    name: "Le Caméléon",
    description: "S'intègre au groupe dont il a reçu le mot, au choix aléatoire.",
    team: "neutral",
    wordAssignment: "civilian",
    ability: "Recevez aléatoirement le mot des civils ou des Undercover et adaptez-vous.",
  },
  saboteur: {
    id: "saboteur",
    name: "Le Saboteur",
    description: "Faire durer la partie aussi longtemps que possible sans favoriser un camp.",
    team: "neutral",
    wordAssignment: "unique",
    ability: "Remportez la partie si vous survivez à suffisamment de tours (par défaut 5 tours d'élimination).",
    uniqueWord: {
      word: "???",
      definition: "Votre objectif est de brouiller les pistes sans révéler votre absence de mot concret.",
    },
    saboteurTargetRounds: 5,
  },
  thief: {
    id: "thief",
    name: "Le Voleur",
    description: "Attendre la première élimination pour voler un rôle et rejoindre le camp correspondant.",
    team: "neutral",
    wordAssignment: "none",
    ability: "Après la première élimination, choisissez de voler le rôle du joueur éliminé pour récupérer son mot et son objectif.",
  },
}

export const OPTIONAL_ROLE_IDS: PlayerRole[] = [
  "detective",
  "spy",
  "mute",
  "chameleon",
  "saboteur",
  "thief",
]

