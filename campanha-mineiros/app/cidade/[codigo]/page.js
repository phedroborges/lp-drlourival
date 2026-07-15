"use client";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import OrgChart from "./OrgChart";
import PeopleView from "./PeopleView";
import TerritoryBoard from "./TerritoryBoard";
import RoutePlanner from "./RoutePlanner";
import PersonModal from "./PersonModal";
import CaboModal from "./CaboModal";

const TABS = [
  { id: "visao", label: "Visão geral" },
  { id: "pessoas", label: "Pessoas" },
  { id: "territorios", label: "Territórios" },
  { id: "rotas", label: "Rotas no mapa" },
];

async function request(url, method, body) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Não foi possível concluir a ação.");
  return result;
}

export default function CidadePage({ params }) {
  const { codigo } = use(params);
  const code = Number(codigo);
  const [cidade, setCidade] = useState(null);
  const [tab, setTab] = useState("visao");
  const [personModal, setPersonModal] = useState(null);
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [caboModal, setCaboModal] = useState(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const response = await fetch(`/api/cidade?codigo=${code}`, { cache: "no-store" });
    setCidade(await response.json());
  }, [code]);
  useEffect(() => { reload(); }, [reload]);

  const bairros = useMemo(() => cidade?.grupos?.flatMap((group) => group.bairros) || [], [cidade]);
  if (!cidade) return <main className="command-page"><div className="loading-card">Organizando a cidade…</div></main>;
  if (cidade.error) return <main className="command-page"><div className="empty-state"><h2>Município não encontrado</h2><Link href="/">Voltar para Goiás</Link></div></main>;

  const coordinators = cidade.lideres.filter((person) => person.nivel === "coordenacao").length;
  const leaders = cidade.lideres.length - coordinators;
  const cabos = bairros.flatMap((bairro) => bairro.cabos).length;
  const activeTerritories = bairros.filter((bairro) => bairro.lideres.length || bairro.cabos.length).length;

  async function run(action) {
    try { setError(""); await action(); await reload(); }
    catch (err) { setError(err.message); }
  }
  function openPerson(person = null) { setPersonModal(person); setPersonModalOpen(true); }
  async function savePerson(form) {
    await run(() => request("/api/lideres", personModal ? "PATCH" : "POST", personModal ? { id: personModal.id, ...form } : { municipio_codigo: code, ...form }));
    setPersonModalOpen(false);
  }
  async function deletePerson(person) {
    if (!confirm(`Excluir “${person.nome}” da estrutura?`)) return;
    await run(() => request("/api/lideres", "DELETE", { id: person.id }));
    setPersonModalOpen(false);
  }
  async function saveCabo(form) {
    await run(() => request("/api/cabos", caboModal?.cabo ? "PATCH" : "POST", caboModal?.cabo ? { id: caboModal.cabo.id, ...form } : form));
    setCaboModal(null);
  }
  async function deleteCabo(cabo) {
    if (!confirm(`Excluir “${cabo.nome}”?`)) return;
    await run(() => request("/api/cabos", "DELETE", { id: cabo.id }));
    setCaboModal(null);
  }

  return (
    <main className="command-page city-command">
      <nav className="breadcrumb"><Link href="/">Goiás</Link><span>/</span><strong>{cidade.nome}</strong></nav>
      <header className="city-hero">
        <div><span className="eyebrow">{cidade.sudoeste ? "Prioridade · Sudoeste Goiano" : "Operação municipal"}</span><h1>{cidade.nome}</h1><p>A cidade inteira em uma única central: comando, lideranças, territórios, cabos e rotas.</p></div>
        <button className="primary-button prominent" onClick={() => openPerson()}>+ Adicionar pessoa</button>
      </header>
      <section className="city-scoreboard">
        <article><span>Coordenação</span><strong>{coordinators}</strong><small>{coordinators ? "comando definido" : "precisa de responsável"}</small></article>
        <article><span>Lideranças</span><strong>{leaders}</strong><small>na estrutura</small></article>
        <article><span>Cabos eleitorais</span><strong>{cabos}</strong><small>em campo</small></article>
        <article><span>Cobertura</span><strong>{activeTerritories}<em>/{bairros.length}</em></strong><small>territórios ativos</small></article>
      </section>
      <nav className="city-tabs" aria-label="Seções da cidade">{TABS.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>{item.label}{item.id === "pessoas" ? <span>{cidade.lideres.length}</span> : item.id === "territorios" ? <span>{bairros.length}</span> : item.id === "rotas" ? <span>{cidade.rotas.length}</span> : null}</button>)}</nav>
      {error ? <div className="error-banner">{error}<button onClick={() => setError("")}>×</button></div> : null}
      <section className="city-content">
        {tab === "visao" ? <><div className="section-toolbar"><div><span className="eyebrow">Organograma territorial</span><h2>Quem coordena quem — e onde</h2><p>A estrutura é montada pelos vínculos cadastrados, sem duplicar informações na tela.</p></div><button className="secondary-button" onClick={() => setTab("pessoas")}>Gerenciar pessoas</button></div><OrgChart cidade={cidade} onEdit={openPerson} onAdd={openPerson} /></> : null}
        {tab === "pessoas" ? <PeopleView cidade={cidade} onEdit={openPerson} onAdd={openPerson} /> : null}
        {tab === "territorios" ? <TerritoryBoard cidade={cidade} onAddBairro={(name) => run(() => request("/api/bairros", "POST", { municipio_codigo: code, nome: name }))} onDeleteBairro={(bairro) => confirm(`Excluir “${bairro.nome}” e seus cabos?`) && run(() => request("/api/bairros", "DELETE", { id: bairro.id }))} onCabo={(cabo, bairro) => setCaboModal({ cabo, bairro })} onAssign={(lider_id, bairro_id) => run(() => request("/api/assign", "POST", { lider_id, bairro_id }))} onUnassign={(lider_id, bairro_id) => run(() => request("/api/assign", "DELETE", { lider_id, bairro_id }))} /> : null}
        {tab === "rotas" ? <RoutePlanner cidade={cidade} onChanged={reload} /> : null}
      </section>
      {personModalOpen ? <PersonModal person={personModal} cidade={cidade} onClose={() => setPersonModalOpen(false)} onSave={savePerson} onDelete={deletePerson} /> : null}
      {caboModal ? <CaboModal cabo={caboModal.cabo} bairro={caboModal.bairro} lideres={caboModal.bairro.lideres} onClose={() => setCaboModal(null)} onSave={saveCabo} onDelete={deleteCabo} /> : null}
    </main>
  );
}
