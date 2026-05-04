import { ReactNode } from "react";

interface TerminalProps {
  title?: string;
  status?: string;
  children: ReactNode;
  className?: string;
}

export function Terminal({ title = "TERMINAL_BREACH v2.0", status = "FIREWALL: ATIVO", children, className = "" }: TerminalProps) {
  return (
    <div className={`crt panel-glow rounded-lg bg-card/70 backdrop-blur-md border border-border overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-black/60">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-destructive/70" />
          <span className="h-2 w-2 rounded-full bg-warn/70" />
          <span className="h-2 w-2 rounded-full bg-primary/80" />
          <span className="ml-3 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-muted-foreground font-bold">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-primary text-primary pulse-dot" />
          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-primary/85 text-glow">{status}</span>
        </div>
      </div>
      <div className="p-5 sm:p-7 font-mono text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export type LineTone = "primary" | "warn" | "info" | "destructive" | "muted" | "accent" | "success";

export function Line({ tag = "SYS", tone = "primary", children, className = "" }: { tag?: string; tone?: LineTone; children: ReactNode; className?: string }) {
  const toneClass: Record<LineTone, string> = {
    primary: "text-primary",
    warn: "text-warn",
    info: "text-info",
    destructive: "text-destructive",
    muted: "text-muted-foreground",
    accent: "text-accent",
    success: "text-success",
  };
  return (
    <div className={`animate-typeline ${className}`}>
      <span className={`${toneClass[tone]} text-glow font-bold`}>[{tag}]</span>{" "}
      <span className="text-foreground/95">{children}</span>
    </div>
  );
}
