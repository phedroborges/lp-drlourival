"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";

/**
 * SEÇÃO 3 — O DIAGNÓSTICO. Os números do abandono.
 * Fundo branco (o mais "frio" da página, como sala de exame), números
 * gigantes em laranja, um por tela. O 250 conta de 0 a 250 na rolagem.
 * Sem fotos: só tipografia.
 */

function Contador250() {
  const ref = useRef<HTMLSpanElement>(null);
  const [valor, setValor] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        obs.disconnect();
        const duracao = 1400;
        const inicio = performance.now();
        const passo = (agora: number) => {
          const t = Math.min((agora - inicio) / duracao, 1);
          setValor(Math.round(250 * (1 - Math.pow(1 - t, 3))));
          if (t < 1) requestAnimationFrame(passo);
        };
        requestAnimationFrame(passo);
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return <span ref={ref}>R$ {valor}</span>;
}

const numeros = [
  {
    destaque: "NENHUM",
    frase:
      "pediatra ou especialista de plantão na UPA na hora que seu filho mais precisa",
  },
  {
    destaque: "ZERO",
    frase: "leitos de UTI para recém-nascidos na cidade",
  },
  {
    destaque: "SEM",
    frase:
      "transporte público nas cidades pequenas. Quem não tem carro, não chega no médico",
  },
];

export function Secao3Diagnostico() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-3xl px-5 pt-20 md:pt-28">
        <Reveal>
          <p className="text-center titulo-impacto text-xl sm:text-2xl text-azul/60">
            O exame da nossa terra saiu. Olha o resultado.
          </p>
        </Reveal>
      </div>

      {numeros.map((n) => (
        <div
          key={n.destaque}
          className="min-h-[65svh] flex items-center justify-center px-5"
        >
          <Reveal className="text-center max-w-xl">
            <p className="titulo-impacto text-6xl sm:text-7xl md:text-8xl text-laranja">
              {n.destaque}
            </p>
            <p className="mt-4 text-azul font-bold text-lg sm:text-xl leading-relaxed">
              {n.frase}
            </p>
          </Reveal>
        </div>
      ))}

      {/* R$ 250 — conta de 0 até 250 na rolagem */}
      <div className="min-h-[65svh] flex items-center justify-center px-5">
        <Reveal className="text-center max-w-xl">
          <p className="titulo-impacto text-6xl sm:text-7xl md:text-8xl text-laranja tabular-nums">
            <Contador250 />
          </p>
          <p className="mt-4 text-azul font-bold text-lg sm:text-xl leading-relaxed">
            por dia. O preço da terapia de uma criança autista quando o poder
            público não oferece nada
          </p>
        </Reveal>
      </div>

      {/* Frase final sozinha na tela, em placa azul */}
      <div className="min-h-[50svh] flex items-center justify-center px-5 pb-24">
        <Reveal className="text-center max-w-2xl">
          <div className="rounded-3xl bg-azul text-creme px-7 py-9 sm:px-12 sm:py-11 -rotate-1 shadow-xl shadow-azul/20">
            <p className="titulo-impacto text-2xl sm:text-3xl md:text-4xl leading-snug">
              Isso não é azar.{" "}
              <span className="text-amarelo">
                É escolha de quem decide de longe.
              </span>
            </p>
            <p className="mt-4 text-creme/85 font-semibold text-base sm:text-lg">
              E isso é só Mineiros. Multiplica pelo interior inteiro de Goiás.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
