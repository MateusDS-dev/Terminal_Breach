import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Terminal, Line } from "@/components/terminal/Terminal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameSession } from "@/components/terminal/GameSession";
import { StatsReport } from "@/components/terminal/StatsReport";
import { Leaderboard } from "@/components/terminal/Leaderboard";
import { GhostMode } from "@/components/terminal/GhostMode";
import { MultiplayerSession } from "@/components/terminal/MultiplayerSession";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Terminal Breach — Invada o sistema" },
      { name: "description", content: "Jogo de adivinhação com narrativa hacker, busca binária e relatório de auditoria. Versão web do projeto Terminal Breach em C." },
      { property: "og:title", content: "Terminal Breach — Invada o sistema" },
      { property: "og:description", content: "Jogo de adivinhação com narrativa hacker, busca binária e relatório de auditoria." },
    ],
  }),
  component: Index,
});

type View = "login" | "menu" | "play" | "daily" | "stats" | "leaderboard" | "ghost" | "multiplayer";

const ASCII = `
████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗     
╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║     
   ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║     
   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║     
   ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗
   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝
        ██████╗ ██████╗ ███████╗ █████╗  ██████╗██╗  ██╗
        ██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔════╝██║  ██║
        ██████╔╝██████╔╝█████╗  ███████║██║     ███████║
        ██╔══██╗██╔══██╗██╔══╝  ██╔══██║██║     ██╔══██║
        ██████╔╝██║  ██║███████╗██║  ██║╚██████╗██║  ██║
        ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝`;

function Index() {
  const [view, setView] = useState<View>("login");
  const [player, setPlayer] = useState("");
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (view === "login") inputRef.current?.focus(); }, [view]);

  function login(e: React.FormEvent) {
    e.preventDefault();
    const name = draft.trim() || "Anonimo";
    setPlayer(name);
    setView("menu");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 grid-bg">
      <div className="w-full max-w-3xl">
        <header className="mb-6 text-center select-none">
          <pre className="hidden sm:block text-[0.4rem] md:text-[0.52rem] leading-[1.05] text-primary text-glow-strong whitespace-pre overflow-x-auto animate-flicker">{ASCII}</pre>
          <h1 className="sm:hidden text-3xl font-bold text-primary text-glow-strong tracking-widest">TERMINAL BREACH</h1>
          <p className="mt-3 text-[10px] sm:text-xs uppercase tracking-[0.4em] text-muted-foreground">
            <span className="text-accent">//</span> Pense como um hacker. Aja como um algoritmo. <span className="text-accent">//</span>
          </p>
        </header>

        {view === "login" && (
          <Terminal title="LOGIN_HACKER" status="AGUARDANDO IDENTIFICAÇÃO">
            <Line tag="SYS">Sistema online. Firewall ativo. Modo: PVP educativo.</Line>
            <Line tag="SYS">Identifique-se para iniciar a sessão.</Line>
            <Line tag="EDU" tone="accent" className="mt-2">Objetivo: descobrir um número de 1–100 com o <span className="text-primary text-glow">menor número de tentativas</span>. O algoritmo ótimo é a <span className="text-primary text-glow">busca binária</span>.</Line>
            <form onSubmit={login} className="mt-5 flex items-center gap-3 border-t border-border pt-4">
              <span className="text-primary text-glow shrink-0">login://</span>
              <Input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="ex: neo, morpheus, trinity..."
                maxLength={32}
                className="flex-1 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary text-foreground font-mono caret"
              />
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/85 text-glow font-bold">
                CONECTAR ▶
              </Button>
            </form>
          </Terminal>
        )}

        {view === "menu" && (
          <Terminal title="MAIN_MENU" status={`OP: ${player.toUpperCase()}`}>
            <Line tag="SYS">Bem-vindo, <span className="text-accent text-glow">{player}</span>. Selecione uma operação:</Line>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MenuBtn n={1} label="Iniciar invasão"         desc="Escolha o nível de firewall"       onClick={() => setView("play")} />
              <MenuBtn n={2} label="Desafio diário"          desc="Mesmo código para todos · hoje"    onClick={() => setView("daily")} accent />
              <MenuBtn n={3} label="Relatório de auditoria"  desc="Estatísticas + histograma"          onClick={() => setView("stats")} />
              <MenuBtn n={4} label="Placar de líderes"       desc="Top 10 por SCORE"                   onClick={() => setView("leaderboard")} />
              <MenuBtn n={5} label="Modo Fantasma"           desc="Busca binária automática"           onClick={() => setView("ghost")} accent />
              <MenuBtn n={6} label="Multiplayer (PvP)"       desc="Sala por código · API C"            onClick={() => setView("multiplayer")} accent />
            </div>
            <div className="mt-6 flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">SCORE = (1000 × mult / tent) + bônus tempo</span>
              <Button variant="ghost" onClick={() => setView("login")} className="text-muted-foreground hover:text-primary">
                ⏻ Encerrar sessão
              </Button>
            </div>
          </Terminal>
        )}

        {view === "play" && <GameSession player={player} onExit={() => setView("menu")} />}
        {view === "daily" && <GameSession player={player} onExit={() => setView("menu")} daily />}
        {view === "stats" && <StatsReport onBack={() => setView("menu")} />}
        {view === "leaderboard" && <Leaderboard onBack={() => setView("menu")} />}
        {view === "ghost" && <GhostMode onBack={() => setView("menu")} />}
        {view === "multiplayer" && <MultiplayerSession player={player} onExit={() => setView("menu")} />}

        <footer className="mt-6 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Terminal Breach · Web port · Baseado no projeto C de <span className="text-primary/80">MateusDS-dev</span>
        </footer>
      </div>
    </main>
  );
}

function MenuBtn({ n, label, desc, onClick, accent = false }: { n: number; label: string; desc: string; onClick: () => void; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`group text-left rounded-md border p-4 transition-all duration-200 hover:translate-x-1 ${
        accent
          ? "border-accent/50 bg-accent/5 hover:bg-accent/15 hover:border-accent"
          : "border-border bg-input/40 hover:bg-primary/10 hover:border-primary"
      }`}
    >
      <div className={`font-bold tracking-wider text-glow ${accent ? "text-accent" : "text-primary"}`}>
        &gt; {n}. {label}
      </div>
      <div className="mt-1 text-xs text-muted-foreground group-hover:text-foreground/80">{desc}</div>
    </button>
  );
}
