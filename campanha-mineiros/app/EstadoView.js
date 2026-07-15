"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import EstadoMap from "./EstadoMap";

function CityRow({ m }) {
  return (
    <Link className="cityrow" href={`/cidade/${m.codigo}`}>
      <span className="mdot" style={{
        background: m.total ? "var(--green)" : "var(--danger-soft)",
        border: `1.5px solid ${m.total ? "var(--ink)" : "var(--danger)"}`,
      }} />
      <span className="nm">{m.nome}</span>
      {m.sudoeste ? <span className="sud">SO</span> : null}
      <span className="count">{m.total ? `${m.nLideres} líd · ${m.nCabos} cabo` : "—"}</span>
    </Link>
  );
}

export default function EstadoView({ municipios }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const totLid = municipios.reduce((a, m) => a + m.nLideres, 0);
  const totCab = municipios.reduce((a, m) => a + m.nCabos, 0);
  const comEquipe = municipios.filter((m) => m.total > 0).length;

  const { sudoeste, outros, filtrados } = useMemo(() => {
    const f = municipios.filter((m) => !query || m.nome.toLowerCase().includes(query));
    return {
      filtrados: f,
      sudoeste: f.filter((m) => m.sudoeste),
      outros: f.filter((m) => !m.sudoeste),
    };
  }, [municipios, query]);

  return (
    <main className="wrap">
      <div className="eyebrow">Goiás · Sistema político da campanha</div>
      <h1>Estado de Goiás</h1>
      <p className="subtitle">
        Clique num município no mapa ou na lista para entrar. Dentro da cidade você cadastra as <strong>lideranças</strong> e,
        nos bairros, os <strong>cabos eleitorais</strong>. O Sudoeste Goiano (foco da campanha) está destacado.
      </p>

      <div className="stats">
        <div className="stat"><div className="num">{totLid}</div><div className="lbl">Lideranças</div></div>
        <div className="stat"><div className="num">{totCab}</div><div className="lbl">Cabos eleitorais</div></div>
        <div className="stat"><div className="num">{comEquipe}<span style={{ fontSize: "1rem", color: "var(--muted)" }}> / 246</span></div><div className="lbl">Municípios com equipe</div></div>
      </div>

      <div className="estado-layout">
        <EstadoMap municipios={municipios} />

        <div>
          <div className="toolbar" style={{ marginBottom: "0.6rem" }}>
            <input type="text" placeholder="Buscar município…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="citylist">
            {query ? (
              filtrados.length ? filtrados.map((m) => <CityRow key={m.codigo} m={m} />) : <div className="empty">Nada encontrado.</div>
            ) : (
              <>
                <div className="subhead">Sudoeste Goiano ({sudoeste.length})</div>
                {sudoeste.map((m) => <CityRow key={m.codigo} m={m} />)}
                <div className="subhead">Demais municípios ({outros.length})</div>
                {outros.map((m) => <CityRow key={m.codigo} m={m} />)}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
