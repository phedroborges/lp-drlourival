/**
 * Placeholder cinza com ícone de imagem (regra 5 do briefing).
 * Todo lugar marcado com 🖼️🔍 usa este componente até a foto real chegar.
 * A `legenda` diz à campanha exatamente qual foto falta buscar.
 */
export function ImagePlaceholder({
  legenda,
  className = "",
}: {
  legenda: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 bg-neutral-400/30 border-2 border-dashed border-neutral-400/60 text-center p-6 ${className}`}
      role="img"
      aria-label={`Espaço reservado: ${legenda}`}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="opacity-50"
        aria-hidden
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      <p className="text-xs opacity-60 max-w-55 leading-snug">🖼️ {legenda}</p>
    </div>
  );
}
