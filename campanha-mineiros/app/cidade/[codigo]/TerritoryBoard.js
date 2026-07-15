"use client";
import { useState } from "react";
import TemperatureBadge from "@/app/ui/TemperatureBadge";

function TerritoryCard({ bairro, cidade, onCabo, onAssign, onUnassign, onDelete }) {
  const [open, setOpen] = useState(bairro.lideres.length > 0 || bairro.cabos.length > 0);
  const available = cidade.lideres.filter((leader) => leader.nivel !== "coordenacao" && !bairro.lideres.some((item) => item.id === leader.id));
  const status = bairro.lideres.length && bairro.cabos.length ? "structured" : bairro.lideres.length || bairro.cabos.length ? "forming" : "empty";
  return (
    <article className={`territory-card ${status}`}>
      <button className="territory-summary" type="button" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="territory-pulse" />
        <span><strong>{bairro.nome}</strong><small>{bairro.lideres.length} lideranças · {bairro.cabos.length} cabos</small></span>
        <span className="coverage-label">{status === "structured" ? "Ativo" : status === "forming" ? "Em formação" : "Sem equipe"}</span>
        <span className="chevron">⌄</span>
      </button>
      {open ? <div className="territory-body">
        <section><div className="mini-heading"><span>Lideranças do território</span><select defaultValue="" onChange={(e) => { if (e.target.value) onAssign(Number(e.target.value), bairro.id); e.target.value = ""; }}><option value="">+ Vincular liderança</option>{available.map((leader) => <option key={leader.id} value={leader.id}>{leader.nome}</option>)}</select></div>{bairro.lideres.length ? <div className="linked-people">{bairro.lideres.map((leader) => <div key={leader.id}><div className="person-avatar mini">{leader.nome.slice(0, 2).toUpperCase()}</div><span><strong>{leader.nome}</strong><small>{leader.cargo || "Liderança"}</small></span><TemperatureBadge value={leader.classificacao} /><button className="icon-button small" onClick={() => onUnassign(leader.id, bairro.id)} aria-label="Desvincular">×</button></div>)}</div> : <p className="quiet-empty">Nenhuma liderança vinculada.</p>}</section>
        <section><div className="mini-heading"><span>Cabos eleitorais</span><button className="text-button" onClick={() => onCabo(null, bairro)}>+ Adicionar cabo</button></div>{bairro.cabos.length ? <div className="cabo-list">{bairro.cabos.map((cabo) => { const leader = bairro.lideres.find((item) => item.id === cabo.lider_id); return <button key={cabo.id} onClick={() => onCabo(cabo, bairro)}><span className="person-avatar mini orange">{cabo.nome.slice(0, 2).toUpperCase()}</span><span><strong>{cabo.nome}</strong><small>{leader ? `Com ${leader.nome}` : "Sem liderança responsável"}{cabo.contato ? ` · ${cabo.contato}` : ""}</small></span><span>Editar</span></button>; })}</div> : <p className="quiet-empty">Ainda não há cabos neste território.</p>}</section>
        <footer><button className="danger-link" onClick={() => onDelete(bairro)}>Excluir território</button></footer>
      </div> : null}
    </article>
  );
}

export default function TerritoryBoard({ cidade, onAddBairro, onDeleteBairro, onCabo, onAssign, onUnassign }) {
  const [name, setName] = useState("");
  const bairros = cidade.grupos.flatMap((group) => group.bairros);
  const active = bairros.filter((bairro) => bairro.lideres.length || bairro.cabos.length).length;
  return (
    <div className="territory-board">
      <div className="section-toolbar"><div><h2>Territórios de {cidade.nome}</h2><p>{active} de {bairros.length} bairros/setores já possuem equipe.</p></div><form className="inline-create" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { onAddBairro(name); setName(""); } }}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Novo bairro ou setor" /><button className="primary-button">+ Criar território</button></form></div>
      {cidade.grupos.map((group) => <section className="territory-group" key={group.grupo}><h3>{group.grupo}<span>{group.bairros.length}</span></h3><div>{group.bairros.map((bairro) => <TerritoryCard key={bairro.id} bairro={bairro} cidade={cidade} onCabo={onCabo} onAssign={onAssign} onUnassign={onUnassign} onDelete={onDeleteBairro} />)}</div></section>)}
      {!bairros.length ? <div className="empty-state"><span>⌖</span><h3>Crie o primeiro território</h3><p>Cadastre bairros ou setores para distribuir lideranças e cabos.</p></div> : null}
    </div>
  );
}
