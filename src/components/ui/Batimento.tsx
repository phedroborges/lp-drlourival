"use client";

import { useEffect, useRef } from "react";

/**
 * Linha de batimento cardíaco — motivo gráfico da marca (vem do "O" de
 * Lourival no adesivo). Usada como divisor entre seções e como conexão
 * na seção dos aliados. Se `animar`, a linha "se desenha" na rolagem.
 */
export function Batimento({
  cor = "var(--laranja)",
  className = "",
  animar = true,
}: {
  cor?: string;
  className?: string;
  animar?: boolean;
}) {
  const ref = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!animar) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          el.classList.add("visivel");
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [animar]);

  return (
    <svg
      viewBox="0 0 400 48"
      fill="none"
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        ref={ref}
        className={animar ? "batimento-desenha" : undefined}
        d="M0 24 H150 L166 24 L176 8 L188 40 L198 14 L206 30 L212 24 H400"
        stroke={cor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
