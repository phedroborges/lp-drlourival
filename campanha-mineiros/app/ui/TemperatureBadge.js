import { Badge } from "@/components/ui/badge";

const CONFIG = {
  verde: { label: "Apoio consolidado", dot: "bg-[var(--verde)]" },
  amarelo: { label: "Em aproximação", dot: "bg-[var(--amarelo)]" },
  vermelho: { label: "Resistência", dot: "bg-[var(--vermelho)]" },
  "": { label: "Sem leitura", dot: "bg-muted-foreground/40" },
};

export default function TemperatureBadge({ value = "" }) {
  const { label, dot } = CONFIG[value] || CONFIG[""];
  return (
    <Badge variant={value || "neutral"}>
      <i className={`inline-block size-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </Badge>
  );
}
