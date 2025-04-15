import { MainMenu } from "@/components/main-menu"

export default function Home() {
  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: "url('/images/menu-bg.png')" }}
    >
      <div className="w-full max-w-3xl">
        <h1 className="text-4xl font-bold text-center text-white mb-2 drop-shadow-glow">Undercover</h1>
        <p className="text-slate-300 text-center mb-8 drop-shadow-glow">Un jeu de déduction sociale et de bluff</p>
        <MainMenu />
      </div>
    </main>
  )
}
