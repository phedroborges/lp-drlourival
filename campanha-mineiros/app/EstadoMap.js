"use client";
import { memo, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GOIAS_SVG } from "@/lib/goiasMap";
import { cityTemperature, TEMPERATURE_COLORS } from "@/lib/temperature";

const SVG_NS = "http://www.w3.org/2000/svg";
// Referência estável: um objeto literal inline em dangerouslySetInnerHTML muda a cada
// render e faz o React reescrever o innerHTML (perdendo cores/rótulos aplicados via DOM).
const SVG_HTML = { __html: GOIAS_SVG };

function EstadoMap({ municipios, onPreview }) {
  const ref = useRef(null);
  const router = useRouter();
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = ref.current;
    const svg = el?.querySelector("svg");
    if (!el || !svg) return;
    svg.removeAttribute("id"); // evita id="go-map" duplicado quando o mapa é montado mais de uma vez (ex.: relatório de impressão)
    const byCode = new Map(municipios.map((m) => [String(m.codigo), m]));

    svg.querySelectorAll("text[data-mun-label]").forEach((node) => node.remove());
    const labels = [];

    svg.querySelectorAll("path").forEach((path) => {
      path.querySelector("title")?.remove();
      const code = (path.id || "").replace("mun-", "");
      const city = byCode.get(code);
      if (!city) return;

      const temp = cityTemperature(city);
      path.style.fill = city.total > 0 ? temp.color : TEMPERATURE_COLORS.semEquipe;
      path.setAttribute("data-has-team", city.total > 0 ? "1" : "0");
      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "link");
      path.setAttribute(
        "aria-label",
        city.total > 0
          ? `${city.nome}: ${city.nLideres} lideranças e ${city.nCabos} cabos, temperatura ${temp.label.toLowerCase()}`
          : `${city.nome}: sem equipe`
      );

      if (city.nLideres > 0) labels.push({ path, city });
    });

    labels.forEach(({ path, city }) => {
      const box = path.getBBox();
      if (!box.width || !box.height) return;
      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("data-mun-label", "1");
      text.setAttribute("x", String(box.x + box.width / 2));
      text.setAttribute("y", String(box.y + box.height / 2));
      text.setAttribute("pointer-events", "none");
      const size = Math.max(6, Math.min(box.width, box.height) * 0.4, 9);
      text.setAttribute("style", `font-size:${Math.min(size, 13)}px`);
      text.setAttribute("class", "mun-label");
      text.textContent = String(city.nLideres);
      svg.appendChild(text);
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

  function handleMouseMove(event) {
    const city = cityAt(event.target);
    onPreview(city);
    if (!city) {
      setHover(null);
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max(event.clientX - bounds.left, 8), bounds.width - 8);
    const y = Math.min(Math.max(event.clientY - bounds.top, 8), bounds.height - 8);
    setHover({ city, x, y });
  }

  return (
    <div className="state-map-shell">
      <div
        className="mapwrap"
        ref={ref}
        onClick={(event) => open(cityAt(event.target))}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
        onFocus={(event) => onPreview(cityAt(event.target))}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") open(cityAt(event.target));
        }}
        dangerouslySetInnerHTML={SVG_HTML}
      />
      {hover ? (
        <div className="map-tooltip" style={{ left: hover.x, top: hover.y }}>
          <strong>{hover.city.nome}</strong>
          {hover.city.total > 0 ? (
            <span>{hover.city.nLideres} lideranças · {hover.city.nCabos} cabos</span>
          ) : (
            <span>Sem equipe</span>
          )}
        </div>
      ) : null}
      <div className="legend" aria-label="Legenda do mapa">
        <span><i className="temp-swatch" style={{ background: TEMPERATURE_COLORS.apoio }} />Apoio</span>
        <span><i className="temp-swatch" style={{ background: TEMPERATURE_COLORS.aproximacao }} />Aproximação</span>
        <span><i className="temp-swatch" style={{ background: TEMPERATURE_COLORS.resistencia }} />Resistência</span>
        <span><i className="temp-swatch" style={{ background: TEMPERATURE_COLORS.semLeitura }} />Sem leitura</span>
        <span><i className="temp-swatch" style={{ background: TEMPERATURE_COLORS.semEquipe }} />Sem equipe</span>
        <span><i className="sud" />Sudoeste</span>
      </div>
    </div>
  );
}

export default memo(EstadoMap);
