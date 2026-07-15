"use client";
import { useState } from "react";

const STATUS = {
  planejada: ["Planejada", "planned"],
  andamento: ["Em andamento", "running"],
  concluida: ["Concluída", "done"],
  atrasada: ["Atrasada", "late"],
  cancelada: ["Cancelada", "cancelled"],
};

function dateLabel(value) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`));
}

export default function OperationBoard({ cidade, onChanged, onOpenRoutes }) {
  const [notice, setNotice] = useState("");
  const tarefas = cidade.tarefas || [];
  const active = tarefas.filter((item) => !["concluida", "cancelada"].includes(item.status_calculado));
  const completed = tarefas.filter((item) => item.status_calculado === "concluida");

  async function shareTask(task) {
    const url = `${window.location.origin}/campo/${task.token}`;
    const text = `${task.rota_nome} · ${task.bairro_nome || cidade.nome} · ${dateLabel(task.data)}`;
    try {
      if (navigator.share) await navigator.share({ title: "Plano de campo", text, url });
      else await navigator.clipboard.writeText(url);
      setNotice("Link do planejamento pronto para enviar.");
    } catch (error) {
      if (error?.name !== "AbortError") setNotice("Não foi possível compartilhar. Abra o link e copie pelo navegador.");
    }
  }

  async function removeTask(task) {
    if (!confirm(`Excluir o planejamento “${task.rota_nome}”?`)) return;
    await fetch("/api/tarefas", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: task.id }) });
    await onChanged();
  }

  function TaskCard({ task }) {
    const [label, tone] = STATUS[task.status_calculado] || STATUS.planejada;
    const progress = task.cabos.length ? Math.round((task.concluidos / task.cabos.length) * 100) : 0;
    return (
      <article className="operation-card">
        <div className="operation-card-top"><span className={`operation-status ${tone}`}><i />{label}</span><span className="operation-date">{dateLabel(task.data)} · {task.turno}</span></div>
        <div className="operation-title"><div className="operation-route-icon">⌁</div><div><span>{task.bairro_nome || "Área geral"}</span><h3>{task.rota_nome}</h3></div></div>
        <div className="operation-progress"><div><span style={{ width: `${progress}%` }} /></div><strong>{task.concluidos}/{task.cabos.length}</strong><small>concluíram</small></div>
        <div className="operation-team">{task.cabos.map((cabo) => <span key={cabo.cabo_id} className={cabo.status === "concluida" ? "done" : cabo.status === "andamento" ? "running" : ""}><i>{cabo.nome.slice(0, 2).toUpperCase()}</i>{cabo.nome}</span>)}</div>
        {task.observacao ? <p className="operation-note">{task.observacao}</p> : null}
        <div className="operation-actions"><a href={`/campo/${task.token}`} target="_blank" rel="noreferrer">Abrir planejamento ↗</a><button onClick={() => shareTask(task)}>Compartilhar</button><button className="operation-delete" onClick={() => removeTask(task)} aria-label="Excluir planejamento">×</button></div>
      </article>
    );
  }

  return (
    <div className="operation-board">
      <div className="section-toolbar operation-toolbar"><div><span className="eyebrow">Comando de rua</span><h2>Operação de campo</h2><p>Distribua as rotas prontas e acompanhe quem iniciou e quem concluiu o trabalho.</p></div><button className="primary-button" onClick={onOpenRoutes}>+ Planejar rota</button></div>
      <section className="operation-kpis"><article><span>Planos ativos</span><strong>{active.length}</strong><small>aguardando a equipe</small></article><article><span>Em andamento</span><strong>{tarefas.filter((task) => task.status_calculado === "andamento").length}</strong><small>nas ruas agora</small></article><article><span>Atrasados</span><strong>{tarefas.filter((task) => task.status_calculado === "atrasada").length}</strong><small>pedem atenção</small></article><article><span>Concluídos</span><strong>{completed.length}</strong><small>histórico da operação</small></article></section>
      {notice ? <div className="operation-notice">{notice}<button onClick={() => setNotice("")}>×</button></div> : null}
      <div className="operation-section-title"><div><h3>Planejamentos ativos</h3><p>Links prontos para compartilhar com os cabos.</p></div><span>{active.length}</span></div>
      {active.length ? <div className="operation-grid">{active.map((task) => <TaskCard key={task.id} task={task} />)}</div> : <div className="operation-empty"><span>⌁</span><h3>Nenhum plano de campo criado</h3><p>Finalize uma rota e transforme-a em uma tarefa para a equipe do bairro.</p><button className="secondary-button" onClick={onOpenRoutes}>Ir para rotas</button></div>}
      {completed.length ? <><div className="operation-section-title history"><div><h3>Concluídos</h3><p>Registro das ações realizadas.</p></div><span>{completed.length}</span></div><div className="operation-grid history-grid">{completed.map((task) => <TaskCard key={task.id} task={task} />)}</div></> : null}
    </div>
  );
}
