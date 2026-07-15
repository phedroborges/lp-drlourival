"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";

const CARGOS = [
  "Liderança política", "Liderança comunitária", "Liderança religiosa", "Liderança rural",
  "Liderança do agro", "Liderança universitária", "Coordenador(a) de campanha", "Cabo eleitoral",
  "Vereador(a)", "Ex-vereador(a)", "Presidente de partido", "Influenciador(a)", "A definir",
];
const CLASSIF = [
  { v: "", label: "— cor —" },
  { v: "verde", label: "🟢 Verde" },
  { v: "amarelo", label: "🟡 Amarelo" },
  { v: "vermelho", label: "🔴 Vermelho" },
];

async function api(url, method, body) {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json().catch(() => ({}));
}

export default function CidadePage({ params }) {
  const { codigo } = use(params);
  const cod = Number(codigo);
  const [cidade, setCidade] = useState(null);
  const [novoLider, setNovoLider] = useState({ nome: "", cargo: "", contato: "", classificacao: "" });
  const [novoBairro, setNovoBairro] = useState("");

  async function reload() {
    const r = await fetch(`/api/cidade?codigo=${cod}`, { cache: "no-store" });
    setCidade(await r.json());
  }
  useEffect(() => { reload(); }, [cod]);

  if (!cidade) return <main className="wrap"><p className="hint">Carregando…</p></main>;
  if (cidade.error) return <main className="wrap"><p className="hint">Município não encontrado.</p></main>;

  /* ---- Lideranças ---- */
  async function addLider(e) {
    e.preventDefault();
    if (!novoLider.nome.trim()) return;
    await api("/api/lideres", "POST", { municipio_codigo: cod, ...novoLider });
    setNovoLider({ nome: "", cargo: "", contato: "", classificacao: "" });
    reload();
  }
  async function patchLider(id, field, value) {
    await api("/api/lideres", "PATCH", { id, [field]: value });
    reload();
  }
  async function delLider(l) {
    if (!confirm(`Excluir "${l.nome}"? Sai também dos bairros onde está.`)) return;
    await api("/api/lideres", "DELETE", { id: l.id });
    reload();
  }

  /* ---- Bairros / cabos ---- */
  async function addBairro(e) {
    e.preventDefault();
    if (!novoBairro.trim()) return;
    await api("/api/bairros", "POST", { municipio_codigo: cod, nome: novoBairro });
    setNovoBairro("");
    reload();
  }
  async function delBairro(b) {
    if (!confirm(`Excluir o bairro "${b.nome}" e seus cabos?`)) return;
    await api("/api/bairros", "DELETE", { id: b.id });
    reload();
  }
  async function puxar(bairro_id, lider_id) {
    if (!lider_id) return;
    await api("/api/assign", "POST", { lider_id: Number(lider_id), bairro_id });
    reload();
  }
  async function tirar(bairro_id, lider_id) {
    await api("/api/assign", "DELETE", { lider_id, bairro_id });
    reload();
  }
  async function addCabo(bairro_id, input) {
    if (!input.value.trim()) return;
    await api("/api/cabos", "POST", { nome: input.value, bairro_id });
    input.value = "";
    reload();
  }
  async function patchCabo(id, patch) { await api("/api/cabos", "PATCH", { id, ...patch }); reload(); }
  async function delCabo(c) {
    if (!confirm(`Excluir o cabo "${c.nome}"?`)) return;
    await api("/api/cabos", "DELETE", { id: c.id });
    reload();
  }

  const temBairros = cidade.grupos.length > 0;

  return (
    <main className="wrap">
      <div className="crumb"><Link href="/">← Estado de Goiás</Link></div>
      <div className="eyebrow">{cidade.sudoeste ? "Sudoeste Goiano" : "Município"}</div>
      <h1>{cidade.nome}</h1>
      <p className="subtitle">
        Cadastre as <strong>lideranças</strong> da cidade e, nos <strong>bairros</strong>, puxe cada liderança e adicione os cabos eleitorais dela.
      </p>

      {/* Lideranças */}
      <section className="section">
        <h2>Lideranças da cidade <span className="badge-count">{cidade.lideres.length}</span></h2>
        <form className="card" onSubmit={addLider} style={{ margin: "0.6rem 0 1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <input style={{ flex: "2 1 11rem" }} placeholder="Nome" value={novoLider.nome} onChange={(e) => setNovoLider({ ...novoLider, nome: e.target.value })} />
            <input style={{ flex: "1.6 1 9rem" }} list="cargos" placeholder="Cargo / papel" value={novoLider.cargo} onChange={(e) => setNovoLider({ ...novoLider, cargo: e.target.value })} />
            <input style={{ flex: "1.6 1 9rem" }} placeholder="Contato / obs" value={novoLider.contato} onChange={(e) => setNovoLider({ ...novoLider, contato: e.target.value })} />
            <select value={novoLider.classificacao} onChange={(e) => setNovoLider({ ...novoLider, classificacao: e.target.value })}>
              {CLASSIF.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
            </select>
            <button className="primary" type="submit">+ Liderança</button>
          </div>
        </form>
        <datalist id="cargos">{CARGOS.map((c) => <option key={c} value={c} />)}</datalist>

        {cidade.lideres.length === 0 ? (
          <div className="empty">Nenhuma liderança nesta cidade ainda.</div>
        ) : cidade.lideres.map((l) => (
          <div className="row" key={l.id}>
            <input className="grow" defaultValue={l.nome} placeholder="Nome" onBlur={(e) => e.target.value !== l.nome && patchLider(l.id, "nome", e.target.value)} />
            <input className="grow" list="cargos" defaultValue={l.cargo} placeholder="Cargo" onBlur={(e) => e.target.value !== l.cargo && patchLider(l.id, "cargo", e.target.value)} />
            <input className="grow" defaultValue={l.contato} placeholder="Contato / obs" onBlur={(e) => e.target.value !== l.contato && patchLider(l.id, "contato", e.target.value)} />
            <select value={l.classificacao || ""} onChange={(e) => patchLider(l.id, "classificacao", e.target.value)}>
              {CLASSIF.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
            </select>
            {l.classificacao ? <span className={`tag ${l.classificacao}`}>{l.classificacao}</span> : null}
            <button className="ghost tiny del" onClick={() => delLider(l)}>Excluir</button>
          </div>
        ))}
      </section>

      {/* Bairros & cabos */}
      <section className="section">
        <h2>Bairros &amp; cabos eleitorais</h2>
        <p className="hint" style={{ margin: "0.2rem 0 0.8rem" }}>
          {temBairros ? "Em cada bairro, puxe uma liderança da cidade e adicione os cabos dela." : "Nenhum bairro cadastrado nesta cidade. Adicione abaixo."}
        </p>

        <form className="add-cabo" onSubmit={addBairro} style={{ maxWidth: "26rem", marginBottom: "1.1rem" }}>
          <input placeholder="Adicionar bairro / setor…" value={novoBairro} onChange={(e) => setNovoBairro(e.target.value)} />
          <button type="submit">+ Bairro</button>
        </form>

        {cidade.grupos.map((g) => (
          <div className="group" key={g.grupo}>
            {cidade.grupos.length > 1 || g.grupo !== "Bairros" ? <div className="group-title">{g.grupo} <span className="group-count">{g.bairros.length}</span></div> : null}
            <div className="grid">
              {g.bairros.map((b) => {
                const tier = b.lideres.length ? 2 : (b.cabos.length ? 1 : 0);
                const disp = cidade.lideres.filter((l) => !b.lideres.some((x) => x.id === l.id));
                return (
                  <div className="bairro" key={b.id}>
                    <div className="bairro-head">
                      <span className="dot" data-tier={tier} />
                      <span className="bairro-name">{b.nome}</span>
                      <span className="bairro-count">{b.lideres.length} líd · {b.cabos.length} cabo</span>
                    </div>

                    {b.lideres.length > 0 ? (
                      <div className="lideres">
                        {b.lideres.map((l) => (
                          <div className="lidchip" key={l.id}>
                            <span className="nm">{l.nome}</span>
                            {l.cargo ? <span className="meta">· {l.cargo}</span> : null}
                            {l.classificacao ? <span className={`tag ${l.classificacao}`}>{l.classificacao}</span> : null}
                            <button className="rm" title="Tirar do bairro" onClick={() => tirar(b.id, l.id)}>✕</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="nolider">Sem liderança. Puxe uma abaixo.</div>
                    )}

                    <div className="puxar">
                      <select defaultValue="" onChange={(e) => { puxar(b.id, e.target.value); e.target.value = ""; }}>
                        <option value="">+ Puxar liderança…</option>
                        {disp.map((l) => <option key={l.id} value={l.id}>{l.nome}{l.classificacao ? ` (${l.classificacao})` : ""}</option>)}
                      </select>
                    </div>

                    <div className="cabos-title">Cabos eleitorais</div>
                    {b.cabos.map((c) => (
                      <div className="crow" key={c.id}>
                        <input className="nm" defaultValue={c.nome} placeholder="Nome do cabo" onBlur={(e) => e.target.value !== c.nome && patchCabo(c.id, { nome: e.target.value })} />
                        <input className="ct" defaultValue={c.contato} placeholder="Contato / obs" onBlur={(e) => e.target.value !== c.contato && patchCabo(c.id, { contato: e.target.value })} />
                        <select className="lidsel" value={c.lider_id ?? ""} title="Responde a qual liderança" onChange={(e) => patchCabo(c.id, { lider_id: e.target.value ? Number(e.target.value) : null })}>
                          <option value="">— líder —</option>
                          {b.lideres.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
                        </select>
                        <button className="ghost tiny" onClick={() => delCabo(c)}>✕</button>
                      </div>
                    ))}
                    <form className="add-cabo" onSubmit={(e) => { e.preventDefault(); addCabo(b.id, e.target.elements.cabo); }}>
                      <input name="cabo" placeholder="Adicionar cabo eleitoral…" autoComplete="off" />
                      <button type="submit">+ Cabo</button>
                    </form>
                    <div style={{ marginTop: "0.5rem", textAlign: "right" }}>
                      <button className="ghost tiny" onClick={() => delBairro(b)}>Excluir bairro</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
