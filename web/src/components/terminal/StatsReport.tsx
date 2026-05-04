import { Terminal, Line } from "@/components/terminal/Terminal";
import { Button } from "@/components/ui/button";
import {
  loadSessions,
  meanRec,
  stddevRec,
  bestIdxRec,
  worstIdxRec,
  winsRec,
  buildHistogram,
  MAX_HIST,
  advisorTips,
  clearSessions,
  totalScore,
  currentStreak,
  optimalAttempts,
} from "@/lib/terminal-breach";
import { useState } from "react";

export function StatsReport({ onBack }: { onBack: () => void }) {
  const [sessions, setSessions] = useState(() => loadSessions());
  const n = sessions.length;
  const wins = winsRec(sessions, n);
  const mean = meanRec(sessions, n);
  const sd = stddevRec(sessions, n, mean);
  const bestI = bestIdxRec(sessions, n);
  const worstI = worstIdxRec(sessions, n);
  const { freq, max } = buildHistogram(sessions);
  const tips = advisorTips(sessions);

  if (n === 0) {
    return (
      <Terminal title="AUDIT_REPORT" status="LOG VAZIO">
        <Line tag="SYS" tone="warn">Nenhuma sessão registrada ainda.</Line>
        <Line tag="SYS">Execute uma invasão para gerar dados de auditoria.</Line>
        <div className="mt-6">
          <Button onClick={onBack} variant="outline" className="border-border">← Menu principal</Button>
        </div>
      </Terminal>
    );
  }

  return (
    <Terminal title="AUDIT_REPORT" status={`${n} SESSÕES`}>
      <Line tag="SYS">Lendo audit_log... análise estatística recursiva concluída.</Line>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card label="Sessões" value={String(n)} />
        <Card label="Vitórias" value={`${wins} (${Math.round((wins / n) * 100)}%)`} />
        <Card label="Streak atual" value={`${currentStreak(sessions)} 🔥`} />
        <Card label="Score total" value={String(totalScore(sessions))} />
        <Card label="Média tentativas" value={`${mean.toFixed(2)} / ${optimalAttempts(1, 100)} ótimo`} />
        <Card label="Desvio padrão" value={sd.toFixed(2)} />
      </div>

      {bestI >= 0 && (
        <Line tag="BEST" tone="success" className="mt-5">
          Melhor sessão: {sessions[bestI].tentativas} tentativas em {sessions[bestI].timestamp} ({sessions[bestI].dificuldade})
        </Line>
      )}
      {worstI >= 0 && (
        <Line tag="WORST" tone="destructive">
          Pior falha: {sessions[worstI].tentativas} tentativas em {sessions[worstI].timestamp} ({sessions[worstI].dificuldade})
        </Line>
      )}

      <div className="mt-6">
        <div className="text-primary text-glow text-xs uppercase tracking-[0.25em] mb-2">[ Frequência de Tentativas ]</div>
        <div className="rounded-md border border-border bg-input/30 p-3 font-mono text-xs space-y-0.5">
          {Array.from({ length: MAX_HIST }, (_, i) => i + 1).map((t) => {
            const w = (freq[t] / max) * 100;
            return (
              <div key={t} className="flex items-center gap-2">
                <span className="text-muted-foreground w-14 shrink-0">{String(t).padStart(2, " ")} tent.</span>
                <span className="text-border">|</span>
                <div className="flex-1 h-3 bg-background rounded-sm overflow-hidden border border-border/60">
                  <div
                    className="h-full bg-gradient-to-r from-primary/60 to-accent/80 transition-all duration-700"
                    style={{ width: `${w}%` }}
                  />
                </div>
                <span className="text-border">|</span>
                <span className={`w-6 text-right ${freq[t] > 0 ? "text-primary text-glow" : "text-muted-foreground"}`}>{freq[t]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-accent text-glow text-xs uppercase tracking-[0.25em] mb-2">[ Sugestões do Advisor ]</div>
        <ul className="space-y-1.5">
          {tips.map((t, i) => (
            <li key={i} className="text-foreground/90"><span className="text-accent">▸</span> {t}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={onBack} className="bg-primary text-primary-foreground hover:bg-primary/85">← Menu</Button>
        <Button
          variant="outline"
          className="border-destructive/60 text-destructive hover:bg-destructive/10"
          onClick={() => { clearSessions(); setSessions([]); }}
        >
          🗑 Limpar log
        </Button>
      </div>
    </Terminal>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-input/40 p-3">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold text-primary text-glow">{value}</div>
    </div>
  );
}
