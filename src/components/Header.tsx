"use client";

import { useEffect, useState } from "react";
import { site, hrefGrupo } from "@/config/site";
import { IconeWhatsApp } from "@/components/ui/IconeWhatsApp";

/**
 * Cabeçalho fixo, sem menu. Começa transparente sobre o amarelo da
 * primeira tela e ganha fundo creme + sombra ao rolar.
 * Logo em texto no estilo do adesivo: "Tô junto com" + placa "Dr. Lourival".
 */
export function Header() {
  const [rolou, setRolou] = useState(false);

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 40);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        rolou ? "bg-creme/95 backdrop-blur shadow-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-3">
        <a href="#topo" className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="titulo-impacto text-azul text-lg">Tô junto com</span>
          <span className="placa text-sm">Dr. Lourival</span>
        </a>

        <a
          href={hrefGrupo()}
          className="inline-flex items-center gap-2 rounded-full bg-laranja hover:bg-laranja-escuro text-creme text-xs sm:text-sm font-extrabold px-4 py-2.5 transition-colors whitespace-nowrap shadow-md shadow-laranja/30"
        >
          <IconeWhatsApp className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">{site.ctaGrupo}</span>
          <span className="sm:hidden">GRUPO DE APOIO</span>
        </a>
      </div>
    </header>
  );
}
