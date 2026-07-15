"use client";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { googleMapsSegments } from "@/lib/googleMapsRoute.mjs";

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date(`${value}T12:00:00`));
}

export default function FieldPlanPage({ params }) {
  const { token } = use(params);
  const [task, setTask] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const load = useCallback(async () => {
    const response = await fetch(`/api/tarefas?token=${encodeURIComponent(token)}`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Planejamento não encontrado");
    setTask(result);
  }, [token]);
  useEffect(() => { load().catch((reason) => setError(reason.message)); }, [load]);
  const mapsLinks = useMemo(() => googleMapsSegments(task?.pontos || []), [task]);

  async function updateCabo(cabo, status) {
    if (status === "concluida" && !confirm(`Confirmar que ${cabo.nome} concluiu esta rota?`)) return;
    setBusy(cabo.cabo_id);
    try {
      const response = await fetch("/api/tarefas", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, cabo_id: cabo.cabo_id, status }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setTask(result);
    } catch (reason) { setError(reason.message); }
    finally { setBusy(null); }
  }

  async function sharePlan() {
    const data = { title: task.rota_nome, text: `Plano de campo · ${task.bairro_nome || task.municipio_nome}`, url: window.location.href };
    if (navigator.share) await navigator.share(data).catch(() => {});
    else await navigator.clipboard.writeText(window.location.href);
  }

  if (error) return <main className="field-page field-error"><div><span>!</span><h1>Não foi possível abrir o plano</h1><p>{error}</p></div></main>;
  if (!task) return <main className="field-page field-loading"><div className="field-loader" /><p>Preparando sua rota…</p></main>;
  const progress = task.cabos.length ? Math.round((task.concluidos / task.cabos.length) * 100) : 0;

  return (
    <main className="field-page">
      <header className="field-header"><div className="field-brand"><span>L</span><div><strong>Dr. Lourival</strong><small>Plano de campo</small></div></div><button onClick={sharePlan}>Compartilhar <span>↗</span></button></header>
      <div className="field-wrap">
        <section className="field-hero"><div className="field-kicker"><span>Rota programada</span><i className={`field-plan-status ${task.status_calculado}`}>{task.status_calculado === "concluida" ? "Concluída" : task.status_calculado === "andamento" ? "Em andamento" : task.status_calculado === "atrasada" ? "Atrasada" : "Planejada"}</i></div><h1>{task.rota_nome}</h1><p className="field-area">⌖ {task.bairro_nome || task.municipio_nome}, {task.municipio_nome}</p><div className="field-schedule"><div><span>Data</span><strong>{formatDate(task.data)}</strong></div><div><span>Turno</span><strong>{task.turno}</strong></div></div>{task.observacao ? <div className="field-brief"><span>Orientação da coordenação</span><p>{task.observacao}</p></div> : null}</section>

        <section className="field-route-card"><div className="field-section-head"><div><span>01 · PERCURSO</span><h2>Rota no mapa</h2></div><small>{task.pontos.length} pontos</small></div><div className="field-timeline">{task.pontos.map((point, index) => { const start = index === 0; const end = index === task.pontos.length - 1; return <div key={point.id} className={start ? "start" : end ? "end" : ""}><span>{start ? "A" : end ? "B" : index}</span><p><strong>{start ? "Ponto de partida" : end ? "Ponto de chegada" : `Parada ${index}`}</strong><small>{Number(point.lat).toFixed(5)}, {Number(point.lng).toFixed(5)}</small></p></div>; })}</div><div className="field-maps-actions">{mapsLinks.map((link, index) => <a key={link} href={link} target="_blank" rel="noreferrer"><span className="field-google">G</span><p><strong>{mapsLinks.length > 1 ? `Abrir trecho ${index + 1}` : "Abrir rota no Google Maps"}</strong><small>Navegação pelas ruas</small></p><i>→</i></a>)}</div></section>

        <section className="field-team-card"><div className="field-section-head"><div><span>02 · EQUIPE</span><h2>Confirmação dos cabos</h2></div><small>{task.concluidos}/{task.cabos.length}</small></div><div className="field-progress"><div><span style={{ width: `${progress}%` }} /></div><p><strong>{progress}%</strong> da equipe concluiu</p></div><div className="field-team-list">{task.cabos.map((cabo) => <article key={cabo.cabo_id} className={cabo.status}><span className="field-person-avatar">{cabo.nome.slice(0, 2).toUpperCase()}</span><div><strong>{cabo.nome}</strong><small>{cabo.status === "concluida" ? "Rota concluída" : cabo.status === "andamento" ? "Está realizando a rota" : "Ainda não iniciou"}</small></div>{cabo.status === "concluida" ? <span className="field-check">✓</span> : <button disabled={busy === cabo.cabo_id} onClick={() => updateCabo(cabo, cabo.status === "andamento" ? "concluida" : "andamento")}>{busy === cabo.cabo_id ? "…" : cabo.status === "andamento" ? "Concluir" : "Iniciar"}</button>}</article>)}</div></section>
        <footer className="field-footer"><strong>Coordenação municipal · {task.municipio_nome}</strong><p>Em caso de dúvida, fale com o responsável pela sua equipe.</p></footer>
      </div>
    </main>
  );
}
