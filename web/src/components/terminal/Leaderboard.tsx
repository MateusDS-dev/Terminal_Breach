import { useState } from "react";
import { Terminal, Line } from "@/components/terminal/Terminal";
import { Button } from "@/components/ui/button";
import { loadSessions, Sessao, computeScore, dailyKey } from "@/lib/terminal-breach";

type Filter = "all" | "ghost" | "operative" | "analyst" | "daily";

export function Leaderboard({ onBack }: { onBack: () => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const all = loadSessions().filter((s) => s.venceu);

  const filtered = all.filter((s) => {
    if (filter === "all") return true;
    if (filter === "daily") return s.modo === "daily";
    if (filter === "ghost") return s.dificuldade === "Ghost";
    if (filter === "operative") return s.dificuldade === "Operativo";
    if (filter === "analyst") return s.dificuldade === "Analista";
    return true;
  });

  const top: (Sessao & { score: number })[] = filtered
    .map((s) => ({ ...s, score: computeScore(s) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const today = dailyKey();

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "Tudo" },
    { id: "ghost", label: "Ghost" },
    { id: "operative", label: "Operativo" },
    { id: "analyst", label: "Analista" },
    { id: "daily", label: `Daily ${today}` },
  ];

  return (
    <Terminal title="LEADERBOARD // ELITE" status="TOP 10 HACKERS">
      <Line tag="SYS">Ranking por <span className="text-accent text-glow">SCORE</span> = (1000 × multiplicador / tentativas) + bônus de tempo.</Line>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-xs uppercase tracking-wider px-3 py-1.5 rounded border transition-all ${
              filter === f.id
                ? "border-primary bg-primary/15 text-primary text-glow"
                : "border-border bg-black/30 text-muted-foreground hover:text-primary hover:border-primary/60"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {top.length === 0 ? (
        <div className="mt-6">
          <Line tag="SYS" tone="warn">Nenhum hacker classificado neste filtro.</Line>
          <Line tag="SYS">Seja o primeiro a deixar sua marca.</Line>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-md border border-border bg-black/40">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border">
                <th className="py-2.5 pl-3 pr-4">#</th>
                <th className="py-2.5 pr-4">Operador</th>
                <th className="py-2.5 pr-4 hidden sm:table-cell">Nível</th>
                <th className="py-2.5 pr-4 text-right">Tent.</th>
                <th className="py-2.5 pr-4 text-right hidden sm:table-cell">Tempo</th>
                <th className="py-2.5 pr-3 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {top.map((s, i) => {
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
                return (
                  <tr key={i} className="border-b border-border/40 last:border-b-0 hover:bg-primary/5 transition-colors">
                    <td className="py-2.5 pl-3 pr-4 text-accent text-glow font-bold">{medal}</td>
                    <td className="py-2.5 pr-4 text-primary text-glow">{s.jogador}</td>
                    <td className="py-2.5 pr-4 hidden sm:table-cell text-foreground/80">{s.dificuldade}</td>
                    <td className="py-2.5 pr-4 text-right text-warn">{s.tentativas}</td>
                    <td className="py-2.5 pr-4 text-right hidden sm:table-cell text-muted-foreground">{s.tempoMs ? `${(s.tempoMs / 1000).toFixed(1)}s` : "—"}</td>
                    <td className="py-2.5 pr-3 text-right text-accent text-glow font-bold">{s.score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <Button onClick={onBack} className="bg-primary text-primary-foreground hover:bg-primary/85 font-bold">← Menu</Button>
      </div>
    </Terminal>
  );
}
