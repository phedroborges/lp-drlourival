"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function EquipePage() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/equipe", { cache: "no-store" }).then((r) => r.json()).then(setData);
  }, []);

  const query = q.trim().toLowerCase();
  const { coordenacao, lideres, cabos } = useMemo(() => {
    if (!data) return { coordenacao: [], lideres: [], cabos: [] };
    const f = (s) => !query || (s || "").toLowerCase().includes(query);
    const pessoas = data.lideres.filter((l) => f(l.nome) || f(l.municipio_nome) || f(l.cargo) || f(l.bairros));
    return {
      coordenacao: pessoas.filter((person) => person.nivel === "coordenacao"),
      lideres: pessoas.filter((person) => person.nivel !== "coordenacao"),
      cabos: data.cabos.filter((c) => f(c.nome) || f(c.municipio_nome) || f(c.bairro_nome) || f(c.lider_nome)),
    };
  }, [data, query]);

  if (!data) return <main className="wrap"><p className="hint">Carregando…</p></main>;

  return (
    <main className="wrap">
      <div className="eyebrow">Visão geral</div>
      <h1>Equipe da campanha</h1>
      <p className="subtitle">Uma coordenação geral para toda a campanha, com lideranças e cabos organizados por município.</p>

      <div className="stats">
        <div className="stat"><div className="num">{data.lideres.filter((person) => person.nivel === "coordenacao").length}</div><div className="lbl">Coordenação geral</div></div>
        <div className="stat"><div className="num">{data.lideres.filter((person) => person.nivel !== "coordenacao").length}</div><div className="lbl">Lideranças</div></div>
        <div className="stat"><div className="num">{data.cabos.length}</div><div className="lbl">Cabos eleitorais</div></div>
      </div>

      <div className="toolbar">
        <input type="text" placeholder="Buscar por nome, município, bairro…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <section className="section">
        <h2>Coordenação da campanha <span className="badge-count">{coordenacao.length}</span></h2>
        {coordenacao.length === 0 ? <div className="empty">Nenhuma pessoa na coordenação geral.</div> : coordenacao.map((person) => (
          <div className="row" key={person.id}>
            <span className="nm" style={{ fontWeight: 700, flex: "1.5 1 8rem" }}>{person.nome}</span>
            <span className="hint" style={{ flex: "1.5 1 8rem" }}>{person.cargo || "Coordenação geral"}</span>
            <span className="global-scope-badge">Toda a campanha</span>
            <span className="hint" style={{ flex: "1.5 1 8rem" }}>Presente em todas as cidades</span>
          </div>
        ))}
      </section>

      <section className="section">
        <h2>Lideranças <span className="badge-count">{lideres.length}</span></h2>
        {lideres.length === 0 ? <div className="empty">Nenhuma liderança.</div> : lideres.map((l) => (
          <div className="row" key={l.id}>
            <span className="nm" style={{ fontWeight: 700, flex: "1.5 1 8rem" }}>{l.nome}</span>
            {l.classificacao ? <span className={`tag ${l.classificacao}`}>{l.classificacao}</span> : null}
            <span className="hint" style={{ flex: "1.5 1 8rem" }}>{l.cargo || "—"}</span>
            <Link href={`/cidade/${l.municipio_codigo}`} style={{ color: "var(--accent)", fontWeight: 600, fontSize: "0.82rem" }}>{l.municipio_nome}</Link>
            <span className="hint" style={{ flex: "1.5 1 8rem" }}>{l.bairros ? `📍 ${l.bairros}` : "sem bairro"}</span>
          </div>
        ))}
      </section>

      <section className="section">
        <h2>Cabos eleitorais <span className="badge-count">{cabos.length}</span></h2>
        {cabos.length === 0 ? <div className="empty">Nenhum cabo eleitoral ainda.</div> : cabos.map((c) => (
          <div className="row" key={c.id}>
            <span className="nm" style={{ fontWeight: 700, flex: "1.5 1 8rem" }}>{c.nome}</span>
            <span className="hint" style={{ flex: "1.3 1 7rem" }}>{c.contato || "—"}</span>
            <span className="hint" style={{ flex: "1 1 7rem" }}>📍 {c.bairro_nome}</span>
            <Link href={`/cidade/${c.municipio_codigo}`} style={{ color: "var(--accent)", fontWeight: 600, fontSize: "0.82rem" }}>{c.municipio_nome}</Link>
            <span className="hint" style={{ flex: "1 1 6rem" }}>{c.lider_nome ? `↳ ${c.lider_nome}` : "sem líder"}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
