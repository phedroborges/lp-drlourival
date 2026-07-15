"use client";
import { useState } from "react";

const STATUS = {
  planejada: ["Planejada", "planned"],
  parcial: ["Retorno parcial", "running"],
  conferida: ["Conferida", "done"],
  atrasada: ["Aguardando retorno", "late"],
  cancelada: ["Cancelada", "cancelled"],
};

const CABO_STATUS = {
  pendente: ["Aguardando conferência", "pending"],
  retorno: ["Retorno confirmado", "returned"],
  ausente: ["Ausência registrada", "absent"],
};

function dateLabel(value) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`));
}

export default function OperationBoard({ cidade, onChanged, onOpenRoutes }) {
  const [notice, setNotice] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [busy, setBusy] = useState("");
  const tarefas = cidade.tarefas || [];
  const active = tarefas.filter((item) => !["conferida", "cancelada"].includes(item.status_calculado));
  const completed = tarefas.filter((item) => item.status_calculado === "conferida");

  async function shareTask(task) {
    const url = `${window.location.origin}/campo/${task.token}`;
    const text = `${task.rota_nome} · ${task.bairro_nome || cidade.nome} · ${dateLabel(task.data)}`;
    try {
      if (navigator.share) await navigator.share({ title: "Plano de campo", text, url });
      else await navigator.clipboard.writeText(url);
      setNotice("Link do planejamento pronto para enviar.");
    } catch (error) {
      if (error?.name !== "AbortError") setNotice("Não foi possível compartilhar. Abra o plano e copie o link pelo navegador.");
    }
  }

  async function recordReturn(task, cabo, status) {
    const key = `${task.id}-${cabo.cabo_id}`;
    setBusy(key);
    try {
      const response = await fetch("/api/tarefas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tarefa_id: task.id, cabo_id: cabo.cabo_id, status }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Não foi possível registrar o retorno.");
      setNotice(status === "retorno" ? `Retorno de ${cabo.nome} confirmado.` : status === "ausente" ? `Ausência de ${cabo.nome} registrada.` : `Conferência de ${cabo.nome} removida.`);
      await onChanged();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy("");
    }
  }

  async function removeTask(task) {
    if (!confirm(`Excluir o planejamento “${task.rota_nome}”?`)) return;
    await fetch("/api/tarefas", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: task.id }) });
    await onChanged();
  }

  function TaskCard({ task }) {
    const [label, tone] = STATUS[task.status_calculado] || STATUS.planejada;
    const progress = task.cabos.length ? Math.round((task.registrados / task.cabos.length) * 100) : 0;
    const isOpen = expandedId === task.id;
    return (
      <article className="operation-card">
        <div className="operation-card-top"><span className={`operation-status ${tone}`}><i />{label}</span><span className="operation-date">{dateLabel(task.data)} · {task.turno}</span></div>
        <div className="operation-title"><div className="operation-route-icon">⌖</div><div><span>{task.bairro_nome || "Área geral"}</span><h3>{task.rota_nome}</h3></div></div>
        <div className="operation-leader"><span>{task.lider_nome?.slice(0, 2).toUpperCase() || "L"}</span><p><small>Liderança responsável</small><strong>{task.lider_nome || "Responsável não definido"}</strong></p>{task.lider_contato ? <em>{task.lider_contato}</em> : null}</div>
        <div className="operation-progress"><div><span style={{ width: `${progress}%` }} /></div><strong>{task.registrados}/{task.cabos.length}</strong><small>conferidos</small></div>
        <div className="operation-team">{task.cabos.map((cabo) => <span key={cabo.cabo_id} className={cabo.status}><i>{cabo.nome.slice(0, 2).toUpperCase()}</i>{cabo.nome}</span>)}</div>
        {task.observacao ? <p className="operation-note">{task.observacao}</p> : null}
        <div className="operation-actions"><a href={`/campo/${task.token}`} target="_blank" rel="noreferrer">Ver plano ↗</a><button onClick={() => shareTask(task)}>Compartilhar</button><button className="operation-return-button" onClick={() => setExpandedId(isOpen ? null : task.id)}>{isOpen ? "Fechar conferência" : "Registrar retorno"}</button><button className="operation-delete" onClick={() => removeTask(task)} aria-label="Excluir planejamento">×</button></div>
        {isOpen ? <div className="return-checklist">
          <div className="return-checklist-head"><div><strong>Conferência no comitê</strong><small>Marque apenas quando a equipe retornar. Não há rastreamento de localização ou tempo.</small></div><span>{task.retornos} retornos · {task.ausentes} ausências</span></div>
          {task.cabos.map((cabo) => {
            const [statusLabel, statusTone] = CABO_STATUS[cabo.status] || CABO_STATUS.pendente;
            const key = `${task.id}-${cabo.cabo_id}`;
            return <div className={`return-row ${statusTone}`} key={cabo.cabo_id}><span className="return-avatar">{cabo.nome.slice(0, 2).toUpperCase()}</span><div><strong>{cabo.nome}</strong><small>{statusLabel}</small></div><div className="return-actions"><button disabled={busy === key} className={cabo.status === "retorno" ? "active returned" : ""} onClick={() => recordReturn(task, cabo, "retorno")}>Confirmar retorno</button><button disabled={busy === key} className={cabo.status === "ausente" ? "active absent" : ""} onClick={() => recordReturn(task, cabo, "ausente")}>Ausente</button>{cabo.status !== "pendente" ? <button disabled={busy === key} className="reset" onClick={() => recordReturn(task, cabo, "pendente")}>Desfazer</button> : null}</div></div>;
          })}
        </div> : null}
      </article>
    );
  }

  return (
    <div className="operation-board">
      <div className="section-toolbar operation-toolbar"><div><span className="eyebrow">Comando de rua</span><h2>Operação de campo</h2><p>Defina a liderança, envie o plano aos cabos e registre o retorno da equipe no comitê.</p></div><button className="primary-button" onClick={onOpenRoutes}>+ Planejar rota</button></div>
      <section className="operation-kpis"><article><span>Planos ativos</span><strong>{active.length}</strong><small>programados para a equipe</small></article><article><span>Retornos confirmados</span><strong>{tarefas.reduce((total, task) => total + task.retornos, 0)}</strong><small>registrados no comitê</small></article><article><span>Aguardando retorno</span><strong>{tarefas.reduce((total, task) => total + Math.max(0, task.cabos.length - task.registrados), 0)}</strong><small>cabos ainda sem conferência</small></article><article><span>Planos conferidos</span><strong>{completed.length}</strong><small>equipes totalmente registradas</small></article></section>
      {notice ? <div className="operation-notice">{notice}<button onClick={() => setNotice("")}>×</button></div> : null}
      <div className="operation-section-title"><div><h3>Planejamentos ativos</h3><p>O link é somente para consulta. A conferência fica com a coordenação.</p></div><span>{active.length}</span></div>
      {active.length ? <div className="operation-grid">{active.map((task) => <TaskCard key={task.id} task={task} />)}</div> : <div className="operation-empty"><span>⌖</span><h3>Nenhum plano de campo ativo</h3><p>Finalize uma rota, escolha a liderança e escale os cabos do bairro.</p><button className="secondary-button" onClick={onOpenRoutes}>Ir para rotas</button></div>}
      {completed.length ? <><div className="operation-section-title history"><div><h3>Planos conferidos</h3><p>Equipes com todos os retornos ou ausências registrados.</p></div><span>{completed.length}</span></div><div className="operation-grid history-grid">{completed.map((task) => <TaskCard key={task.id} task={task} />)}</div></> : null}
    </div>
  );
}
