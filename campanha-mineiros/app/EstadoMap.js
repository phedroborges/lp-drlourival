"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { GOIAS_SVG } from "@/lib/goiasMap";

export default function EstadoMap({ municipios }) {
  const ref = useRef(null);
  const tipRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const byCode = new Map(municipios.map((m) => [String(m.codigo), m]));
    el.querySelectorAll("path").forEach((p) => {
      const code = (p.id || "").replace("mun-", "");
      const m = byCode.get(code);
      if (m) p.setAttribute("data-tier", String(m.tier));
    });
  }, [municipios]);

  function pathAt(e) {
    return e.target && e.target.closest ? e.target.closest("path") : null;
  }
  function onClick(e) {
    const p = pathAt(e);
    if (!p) return;
    const code = (p.id || "").replace("mun-", "");
    if (code) router.push(`/cidade/${code}`);
  }
  function onMove(e) {
    const tip = tipRef.current;
    const p = pathAt(e);
    if (!tip) return;
    if (!p) { tip.style.opacity = 0; return; }
    const code = (p.id || "").replace("mun-", "");
    const m = municipios.find((x) => String(x.codigo) === code);
    const nome = p.getAttribute("data-nome") || "";
    tip.textContent = m ? `${nome} — ${m.nLideres} líder(es) · ${m.nCabos} cabo(s)` : nome;
    tip.style.left = e.clientX + "px";
    tip.style.top = e.clientY + "px";
    tip.style.opacity = 1;
  }
  function onLeave() { if (tipRef.current) tipRef.current.style.opacity = 0; }

  return (
    <div className="mapcard">
      <div
        className="mapwrap"
        ref={ref}
        onClick={onClick}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        dangerouslySetInnerHTML={{ __html: GOIAS_SVG }}
      />
      <div className="legend">
        <span><i className="t0" />Sem cadastro</span>
        <span><i className="t1" />1 pessoa</span>
        <span><i className="t2" />2–3</span>
        <span><i className="t3" />4 ou mais</span>
        <span><i className="sud" />Sudoeste Goiano</span>
      </div>
      <div className="maptip" ref={tipRef} />
    </div>
  );
}
