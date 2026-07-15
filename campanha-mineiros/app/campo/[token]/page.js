"use client";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { googleMapsMobileUrl } from "@/lib/googleMapsRoute.mjs";
import FieldRouteMap from "./FieldRouteMap";

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date(`${value}T12:00:00`));
}

const PLAN_STATUS = {
  planejada: "Planejada",
  parcial: "Em conferência",
  conferida: "Conferida",
  atrasada: "Aguardando retorno",
  cancelada: "Cancelada",
};

export default function FieldPlanPage({ params }) {
  const { token } = use(params);
  const [task, setTask] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const response = await fetch(`/api/tarefas?token=${encodeURIComponent(token)}`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Planejamento não encontrado");
    setTask(result);
  }, [token]);
  useEffect(() => { load().catch((reason) => setError(reason.message)); }, [load]);
  const mapsLink = useMemo(() => googleMapsMobileUrl(task?.pontos || []), [task]);

  async function sharePlan() {
    const data = { title: task.rota_nome, text: `Plano de campo · ${task.bairro_nome || task.municipio_nome}`, url: window.location.href };
    if (navigator.share) await navigator.share(data).catch(() => {});
    else await navigator.clipboard.writeText(window.location.href);
  }

  if (error) return <main className="field-page field-error"><div><span>!</span><h1>Não foi possível abrir o plano</h1><p>{error}</p></div></main>;
  if (!task) return <main className="field-page field-loading"><div className="field-loader" /><p>Preparando sua rota…</p></main>;

  return (
    <main className="field-page">
      <header className="field-header"><div className="field-brand"><span>L</span><div><strong>Dr. Lourival</strong><small>Plano de campo</small></div></div><button onClick={sharePlan}>Compartilhar <span>↗</span></button></header>
      <div className="field-wrap">
        <section className="field-hero"><div className="field-kicker"><span>Rota programada</span><i className={`field-plan-status ${task.status_calculado}`}>{PLAN_STATUS[task.status_calculado] || "Planejada"}</i></div><h1>{task.rota_nome}</h1><p className="field-area">⌖ {task.bairro_nome || task.municipio_nome}, {task.municipio_nome}</p><div className="field-schedule"><div><span>Data</span><strong>{formatDate(task.data)}</strong></div><div><span>Turno</span><strong>{task.turno}</strong></div></div>{task.observacao ? <div className="field-brief"><span>Orientação da coordenação</span><p>{task.observacao}</p></div> : null}</section>

        <section className="field-route-card">
          <div className="field-section-head"><div><span>01 · PERCURSO</span><h2>Rota da equipe</h2><p>Siga a linha azul da partida até a chegada.</p></div><small>Plano oficial</small></div>
          <FieldRouteMap points={task.pontos} routeName={task.rota_nome} />
          <div className="field-route-legend"><span><i className="start" /> Partida</span><span><i className="path" /> Caminho planejado</span><span><i className="end" /> Chegada</span></div>
          {mapsLink ? <a className="field-maps-primary" href={mapsLink} target="_blank" rel="noreferrer"><span className="field-google">G</span><p><strong>Abrir rota no Google Maps</strong><small>Ver o caminho pelas ruas</small></p><i>→</i></a> : null}
          <p className="field-route-note">O mapa acima mostra o planejamento completo. O botão abre os principais pontos no Google Maps para facilitar a navegação.</p>
        </section>

        <section className="field-team-card">
          <div className="field-section-head"><div><span>02 · EQUIPE</span><h2>Quem vai para esta rota</h2><p>Confira a liderança e os cabos escalados.</p></div><small>{task.cabos.length} cabos</small></div>
          <article className="field-leader-card"><span className="field-person-avatar leader">{task.lider_nome?.slice(0, 2).toUpperCase() || "L"}</span><div><small>Liderança responsável</small><strong>{task.lider_nome || "A confirmar pela coordenação"}</strong>{task.lider_contato ? <p>{task.lider_contato}</p> : null}</div><i>Responsável</i></article>
          <div className="field-team-label">Cabos escalados</div>
          <div className="field-team-list">{task.cabos.map((cabo) => <article key={cabo.cabo_id}><span className="field-person-avatar">{cabo.nome.slice(0, 2).toUpperCase()}</span><div><strong>{cabo.nome}</strong><small>Escalado para {task.bairro_nome || task.municipio_nome}</small></div><span className="field-assigned-check">✓</span></article>)}</div>
          <div className="field-return-note"><span>✓</span><p><strong>Não precisa marcar nada neste link</strong><small>Depois do trabalho, a coordenação registra o retorno da equipe no comitê.</small></p></div>
        </section>
        <footer className="field-footer"><strong>Coordenação municipal · {task.municipio_nome}</strong><p>Em caso de dúvida, fale com a liderança responsável pela equipe.</p></footer>
      </div>
    </main>
  );
}
