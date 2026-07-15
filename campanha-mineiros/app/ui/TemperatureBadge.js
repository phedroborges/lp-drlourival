const LABELS = {
  verde: "Apoio consolidado",
  amarelo: "Em aproximação",
  vermelho: "Resistência",
  "": "Sem leitura",
};

export default function TemperatureBadge({ value = "" }) {
  return <span className={`temperature-badge ${value || "neutral"}`}><i />{LABELS[value] || LABELS[""]}</span>;
}
