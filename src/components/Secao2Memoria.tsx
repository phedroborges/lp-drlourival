"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

/**
 * SEÇÃO 2 — A MEMÓRIA ROUBADA.
 * Fundo creme. Slider de arrastar comparando o Samaritano de antes
 * (assets A1/A2 da campanha) com o de hoje.
 */
export function Secao2Memoria() {
  const [posicao, setPosicao] = useState(50);

  return (
    <section className="bg-creme py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-5">
        <Reveal>
          <h2 className="titulo-impacto text-3xl sm:text-4xl md:text-5xl text-azul text-center">
            Teve um tempo em que o interior
            <br className="hidden sm:block" /> vinha para cá{" "}
            <span className="placa text-[0.9em]">atrás de cura.</span>
          </h2>
        </Reveal>

        {/* Comparador antes/depois */}
        <Reveal delay={100}>
          <div className="mt-12 relative aspect-[4/3] sm:aspect-video rounded-3xl overflow-hidden select-none shadow-xl shadow-azul/10 bg-white">
            {/* DEPOIS (fundo) — 🖼️🔍 foto atual, mesmo ângulo da histórica */}
            <div className="absolute inset-0">
              <ImagePlaceholder
                legenda="Foto atual da fachada do Samaritano, mesmo ângulo da histórica (equipe fotografa em Mineiros)"
                className="w-full h-full text-tinta/50 bg-neutral-200"
              />
              <span className="absolute bottom-3 right-3 text-[11px] font-bold bg-azul text-creme px-2.5 py-1 rounded-full">
                Mineiros, hoje
              </span>
            </div>

            {/* ANTES (recortado pelo slider) — 🖼️✅ assets A1/A2 da campanha */}
            <div
              className="absolute inset-0 overflow-hidden border-r-4 border-laranja"
              style={{ width: `${posicao}%` }}
            >
              <div
                className="absolute inset-0"
                style={{ width: "100vw", maxWidth: "56rem" }}
              >
                <ImagePlaceholder
                  legenda="Foto histórica da fachada do Samaritano (asset A2, acervo IBGE — a campanha entrega o arquivo)"
                  className="w-full h-full text-tinta/50 bg-amarelo-claro/60"
                />
              </div>
              <span className="absolute bottom-3 left-3 text-[11px] font-bold bg-laranja text-creme px-2.5 py-1 rounded-full">
                Mineiros, década de 1950
              </span>
            </div>

            {/* Alça do slider */}
            <input
              type="range"
              min={0}
              max={100}
              value={posicao}
              onChange={(e) => setPosicao(Number(e.target.value))}
              aria-label="Arraste para comparar o antes e o depois"
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
              style={{ left: `${posicao}%` }}
            >
              <div className="w-11 h-11 rounded-full bg-laranja text-creme flex items-center justify-center shadow-lg">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden
                >
                  <path d="m9 6-6 6 6 6M15 6l6 6-6 6" />
                </svg>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs font-semibold text-tinta/50">
            Arraste para comparar
          </p>
        </Reveal>

        {/* Texto — entra depois das fotos */}
        <div className="mt-14 space-y-6 leading-relaxed text-base sm:text-lg max-w-2xl mx-auto">
          <Reveal>
            <p>
              De carro, de ônibus, de carona. Gente da região inteira estradava
              até Mineiros porque aqui tinha médico bom e hospital de
              confiança. A cidade carregava o nome com orgulho.{" "}
              <strong className="text-azul">Cidade Saúde.</strong>
            </p>
          </Reveal>
          <Reveal delay={100}>
            <p>
              Aí aconteceu com a gente o que vem acontecendo com o interior
              inteiro de Goiás. Quem decide foi atrás do dinheiro e do
              crescimento a qualquer custo, e esqueceu do principal. O hospital
              que era a nossa referência ficou pelo caminho. Hoje, quem precisa
              de socorro de verdade pega estrada.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <p className="font-extrabold text-azul text-lg sm:text-xl">
              Mineiros é o exemplo. Mas roda esse estado e você vai ver. É
              cidade atrás de cidade vivendo a mesma história.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
