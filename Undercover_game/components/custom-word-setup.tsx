"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"

interface CustomWordSetupProps {
  onBack: () => void
}

interface WordPair {
  id?: string
  civilian: { word: string; definition: string }
  undercover: { word: string; definition: string }
}

export const CustomWordSetup = ({ onBack }: CustomWordSetupProps) => {
  const [wordPairs, setWordPairs] = useState<WordPair[]>([])
  const [newPair, setNewPair] = useState<WordPair>({
    civilian: { word: "", definition: "" },
    undercover: { word: "", definition: "" },
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Charger les mots personnalisés au chargement du composant
  useEffect(() => {
    const loadCustomWords = async () => {
      try {
        setLoading(true)
        // Ici, nous simulons le chargement depuis une base de données
        // Dans une implémentation réelle, vous feriez un appel API
        const storedWords = localStorage.getItem("customWordPairs")
        if (storedWords) {
          setWordPairs(JSON.parse(storedWords))
        }
      } catch (err) {
        setError("Erreur lors du chargement des mots personnalisés")
      } finally {
        setLoading(false)
      }
    }

    loadCustomWords()
  }, [])

  const handleCivilianWordChange = (value: string) => {
    setNewPair({
      ...newPair,
      civilian: { ...newPair.civilian, word: value },
    })
  }

  const handleCivilianDefinitionChange = (value: string) => {
    setNewPair({
      ...newPair,
      civilian: { ...newPair.civilian, definition: value },
    })
  }

  const handleUndercoverWordChange = (value: string) => {
    setNewPair({
      ...newPair,
      undercover: { ...newPair.undercover, word: value },
    })
  }

  const handleUndercoverDefinitionChange = (value: string) => {
    setNewPair({
      ...newPair,
      undercover: { ...newPair.undercover, definition: value },
    })
  }

  const addWordPair = () => {
    if (!newPair.civilian.word || !newPair.undercover.word) {
      setError("Les deux mots sont requis")
      return
    }

    if (
      wordPairs.some(
        (pair) =>
          pair.civilian.word.toLowerCase() === newPair.civilian.word.toLowerCase() ||
          pair.undercover.word.toLowerCase() === newPair.undercover.word.toLowerCase(),
      )
    ) {
      setError("Ces mots existent déjà")
      return
    }

    const newPairWithId = {
      ...newPair,
      id: Date.now().toString(),
    }

    const updatedPairs = [...wordPairs, newPairWithId]
    setWordPairs(updatedPairs)

    // Sauvegarder dans localStorage (simulation de base de données)
    localStorage.setItem("customWordPairs", JSON.stringify(updatedPairs))

    setNewPair({
      civilian: { word: "", definition: "" },
      undercover: { word: "", definition: "" },
    })
    setError(null)
    setSuccess("Paire de mots ajoutée avec succès")

    // Effacer le message de succès après 3 secondes
    setTimeout(() => setSuccess(null), 3000)
  }

  const removeWordPair = (id: string) => {
    const updatedPairs = wordPairs.filter((pair) => pair.id !== id)
    setWordPairs(updatedPairs)
    localStorage.setItem("customWordPairs", JSON.stringify(updatedPairs))
  }

  return (
    <div className="w-full bg-game p-4 rounded-lg">
      <Card className="w-full bg-slate-900/70 backdrop-blur-sm card-neon">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4 text-cyan-300 hover:text-cyan-100 hover:bg-slate-800/50"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-center text-cyan-300">Mots personnalisés</CardTitle>
          <CardDescription className="text-center text-cyan-100">
            Créez vos propres paires de mots pour le jeu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="py-2 bg-cyan-900/30 border-cyan-500/50 text-cyan-300">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="civilian-word" className="text-cyan-200">
                  Mot Civil
                </Label>
                <Input
                  id="civilian-word"
                  placeholder="Ex: Plage"
                  value={newPair.civilian.word}
                  onChange={(e) => handleCivilianWordChange(e.target.value)}
                  className="bg-slate-800/50 border-cyan-900 focus:border-cyan-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="undercover-word" className="text-cyan-200">
                  Mot Undercover
                </Label>
                <Input
                  id="undercover-word"
                  placeholder="Ex: Piscine"
                  value={newPair.undercover.word}
                  onChange={(e) => handleUndercoverWordChange(e.target.value)}
                  className="bg-slate-800/50 border-cyan-900 focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="civilian-def" className="text-cyan-200">
                  Définition Civil
                </Label>
                <Textarea
                  id="civilian-def"
                  placeholder="Définition du mot civil"
                  value={newPair.civilian.definition}
                  onChange={(e) => handleCivilianDefinitionChange(e.target.value)}
                  className="resize-none h-20 bg-slate-800/50 border-cyan-900 focus:border-cyan-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="undercover-def" className="text-cyan-200">
                  Définition Undercover
                </Label>
                <Textarea
                  id="undercover-def"
                  placeholder="Définition du mot undercover"
                  value={newPair.undercover.definition}
                  onChange={(e) => handleUndercoverDefinitionChange(e.target.value)}
                  className="resize-none h-20 bg-slate-800/50 border-cyan-900 focus:border-cyan-500"
                />
              </div>
            </div>

            <Button
              onClick={addWordPair}
              className="w-full flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/50"
            >
              <Plus className="h-4 w-4" />
              Ajouter cette paire de mots
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-cyan-200">Vos paires de mots ({wordPairs.length})</h3>
            <ScrollArea className="h-64 border rounded-md p-2 border-cyan-900/50 bg-slate-800/30">
              {wordPairs.length === 0 ? (
                <p className="text-center text-cyan-500/50 py-8">
                  {loading ? "Chargement..." : "Aucune paire de mots ajoutée"}
                </p>
              ) : (
                <ul className="space-y-3">
                  {wordPairs.map((pair) => (
                    <li key={pair.id} className="p-3 bg-slate-800/50 rounded border border-cyan-900/30">
                      <div className="flex justify-between items-start mb-2">
                        <div className="grid grid-cols-2 gap-4 w-full">
                          <div>
                            <p className="font-medium text-cyan-300">Civil: {pair.civilian.word}</p>
                            <p className="text-sm text-cyan-400/70">{pair.civilian.definition}</p>
                          </div>
                          <div>
                            <p className="font-medium text-cyan-300">Undercover: {pair.undercover.word}</p>
                            <p className="text-sm text-cyan-400/70">{pair.undercover.definition}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeWordPair(pair.id!)}
                          className="text-cyan-300 hover:text-cyan-100 hover:bg-slate-700/50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
