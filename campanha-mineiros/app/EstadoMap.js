"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { GOIAS_SVG } from "@/lib/goiasMap";

export default function EstadoMap({ municipios, onPreview }) {
  const ref = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const byCode = new Map(municipios.map((m) => [String(m.codigo), m]));
    el.querySelectorAll("path").forEach((path) => {
      const code = (path.id || "").replace("mun-", "");
      const city = byCode.get(code);
      if (!city) return;
      path.setAttribute("data-tier", String(city.tier));
      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "link");
      path.setAttribute("aria-label", `${city.nome}: ${city.nLideres} lideranças e ${city.nCabos} cabos`);
    });
  }, [municipios]);

  function cityAt(target) {
    const path = target?.closest?.("path");
    if (!path) return null;
    const code = (path.id || "").replace("mun-", "");
    return municipios.find((item) => String(item.codigo) === code) || null;
  }

  function open(city) {
    if (city) router.push(`/cidade/${city.codigo}`);
  }

  return (
    <div className="state-map-shell">
      <div
        className="mapwrap"
        ref={ref}
        onClick={(event) => open(cityAt(event.target))}
        onMouseMove={(event) => onPreview(cityAt(event.target))}
        onFocus={(event) => onPreview(cityAt(event.target))}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") open(cityAt(event.target));
        }}
        dangerouslySetInnerHTML={{ __html: GOIAS_SVG }}
      />
      <div className="legend" aria-label="Legenda do mapa">
        <span><i className="t0" />Sem equipe</span>
        <span><i className="t1" />Início</span>
        <span><i className="t2" />Em formação</span>
        <span><i className="t3" />Estruturada</span>
        <span><i className="sud" />Sudoeste</span>
      </div>
    </div>
  );
}
