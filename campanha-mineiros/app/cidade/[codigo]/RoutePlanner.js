"use client";
import { useEffect, useRef, useState } from "react";
import { googleMapsSegments } from "@/lib/googleMapsRoute.mjs";

const MINEIROS_CENTER = [-17.5653879, -52.5536721];

async function routeRequest(method, body) {
  const response = await fetch("/api/rotas", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Não foi possível salvar a rota");
  return result;
}

function distanceBetween(a, b) {
  const radius = 6371;
  const toRadians = (value) => value * Math.PI / 180;
  const dLat = toRadians(Number(b.lat) - Number(a.lat));
  const dLng = toRadians(Number(b.lng) - Number(a.lng));
  const lat1 = toRadians(Number(a.lat));
  const lat2 = toRadians(Number(b.lat));
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function totalDistance(points) {
  return points.slice(1).reduce((total, point, index) => total + distanceBetween(points[index], point), 0);
}

export default function RoutePlanner({ cidade, onChanged }) {
  const bairros = cidade.grupos.flatMap((group) => group.bairros);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const mapNode = useRef(null);
  const leaflet = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const activeIdRef = useRef(null);
  const drawModeRef = useRef("idle");
  const pointCountRef = useRef(0);
  const savingRef = useRef(false);
  const lastFittedRoute = useRef(null);
  const [activeId, setActiveId] = useState(cidade.rotas[0]?.id || null);
  const [name, setName] = useState("");
  const [bairroId, setBairroId] = useState("");
  const [notice, setNotice] = useState("");
  const [drawMode, setDrawMode] = useState("idle");
  const [shareNotice, setShareNotice] = useState("");
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ lider_id: "", data: today, turno: "Manhã", observacao: "" });
  const [selectedCabos, setSelectedCabos] = useState([]);
  const [createdTask, setCreatedTask] = useState(null);
  const active = cidade.rotas.find((route) => route.id === activeId) || null;
  const finalized = active?.status === "finalizada";
  const activeBairro = bairros.find((bairro) => bairro.id === active?.bairro_id) || null;
  const eligibleCabos = activeBairro?.cabos || [];
  const eligibleLeaders = cidade.lideres.filter((lider) => lider.nivel !== "coordenacao");

  useEffect(() => {
    activeIdRef.current = activeId;
    pointCountRef.current = active?.pontos.length || 0;
  }, [activeId, active]);

  useEffect(() => { drawModeRef.current = drawMode; }, [drawMode]);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((module) => {
      if (cancelled || !mapNode.current || map.current) return;
      const L = module.default;
      leaflet.current = L;
      map.current = L.map(mapNode.current, { zoomControl: true }).setView(MINEIROS_CENTER, 14);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map.current);
      layer.current = L.layerGroup().addTo(map.current);

      map.current.on("click", async (event) => {
        const routeId = activeIdRef.current;
        const mode = drawModeRef.current;
        const pointCount = pointCountRef.current;
        if (!routeId) { setNotice("Crie ou escolha uma rota antes de desenhar."); return; }
        if (mode === "idle") { setNotice("Escolha abaixo se deseja marcar a partida, adicionar um ponto ou marcar a chegada."); return; }
        if (savingRef.current) return;

        savingRef.current = true;
        try {
          const label = pointCount === 0 ? "Ponto de partida" : mode === "finish" ? "Ponto de chegada" : `Ponto ${pointCount}`;
          await routeRequest("POST", {
            tipo: "ponto",
            rota_id: routeId,
            label,
            lat: event.latlng.lat,
            lng: event.latlng.lng,
          });
          if (mode === "finish") {
            await routeRequest("PATCH", { id: routeId, status: "finalizada", geometria: null, distancia_m: 0, duracao_s: 0 });
            setDrawMode("idle");
            setNotice("Rota finalizada. A linha liga todos os pontos na ordem em que foram criados.");
          } else {
            setDrawMode("waypoint");
            setNotice(pointCount === 0 ? "Partida marcada. Continue clicando no mapa para criar o percurso." : "Ponto adicionado ao desenho.");
          }
          await onChanged();
        } catch (error) {
          setNotice(error.message);
        } finally {
          savingRef.current = false;
        }
      });
    });
    return () => {
      cancelled = true;
      if (map.current) { map.current.remove(); map.current = null; }
    };
  }, [onChanged]);

  useEffect(() => {
    if (!leaflet.current || !layer.current) return;
    const L = leaflet.current;
    layer.current.clearLayers();
    if (!active) return;

    const coordinates = active.pontos.map((point) => [Number(point.lat), Number(point.lng)]);
    if (coordinates.length > 1) {
      L.polyline(coordinates, { color: "#3857d6", weight: 5, opacity: .9, lineJoin: "round" }).addTo(layer.current);
    }
    active.pontos.forEach((point, index) => {
      const isStart = index === 0;
      const isEnd = finalized && index === active.pontos.length - 1;
      const color = isStart ? "#1aa67a" : isEnd ? "#ee6a5c" : "#3857d6";
      const label = isStart ? "Partida" : isEnd ? "Chegada" : `Ponto ${index}`;
      L.circleMarker([Number(point.lat), Number(point.lng)], {
        radius: isStart || isEnd ? 10 : 8,
        color: "#fff",
        weight: 3,
        fillColor: color,
        fillOpacity: 1,
      }).bindTooltip(label, { direction: "top", offset: [0, -7] }).addTo(layer.current);
    });
    if (coordinates.length && lastFittedRoute.current !== active.id) {
      map.current.fitBounds(L.latLngBounds(coordinates).pad(.22), { maxZoom: 16 });
      lastFittedRoute.current = active.id;
    }
  }, [active, finalized]);

  async function createRoute(event) {
    event.preventDefault();
    if (!name.trim() || !bairroId) { setNotice("Informe o nome e o bairro atendido pela rota."); return; }
    try {
      const route = await routeRequest("POST", { municipio_codigo: cidade.codigo, nome: name, bairro_id: Number(bairroId) });
      setName("");
      setBairroId("");
      setActiveId(route.id);
      setDrawMode("start");
      setNotice("Agora clique no mapa para marcar o ponto de partida.");
      lastFittedRoute.current = null;
      await onChanged();
    } catch (error) { setNotice(error.message); }
  }

  async function reopenRoute() {
    if (!active) return;
    await routeRequest("PATCH", { id: active.id, status: "planejamento", geometria: null, distancia_m: 0, duracao_s: 0 });
    setDrawMode("waypoint");
    setNotice("Rota reaberta. Clique no mapa para continuar o desenho.");
    await onChanged();
  }

  async function removePoint(id) {
    await routeRequest("DELETE", { tipo: "ponto", id });
    if (finalized) await routeRequest("PATCH", { id: active.id, status: "planejamento" });
    setDrawMode("waypoint");
    setNotice("Ponto removido. O desenho foi atualizado.");
    await onChanged();
  }

  async function undoLastPoint() {
    const lastPoint = active?.pontos.at(-1);
    if (lastPoint) await removePoint(lastPoint.id);
  }

  async function clearDrawing() {
    if (!active?.pontos.length || !confirm("Remover todos os pontos desta rota?")) return;
    for (const point of [...active.pontos].reverse()) await routeRequest("DELETE", { tipo: "ponto", id: point.id });
    await routeRequest("PATCH", { id: active.id, status: "planejamento", geometria: null, distancia_m: 0, duracao_s: 0 });
    setDrawMode("start");
    setNotice("Desenho limpo. Clique no mapa para marcar uma nova partida.");
    lastFittedRoute.current = null;
    await onChanged();
  }

  async function removeRoute() {
    if (!active || !confirm(`Excluir a rota “${active.nome}”?`)) return;
    await routeRequest("DELETE", { id: active.id });
    setActiveId(null);
    setDrawMode("idle");
    setNotice("");
    await onChanged();
  }

  function selectRoute(value) {
    const id = Number(value) || null;
    setActiveId(id);
    setDrawMode("idle");
    setNotice(id ? "Rota carregada. Use os controles para editar o desenho." : "");
    lastFittedRoute.current = null;
    setTaskOpen(false);
    setCreatedTask(null);
  }

  async function updateRouteArea(value) {
    if (!active) return;
    await routeRequest("PATCH", { id: active.id, bairro_id: Number(value) });
    setTaskOpen(false);
    setCreatedTask(null);
    await onChanged();
  }

  function openTaskForm() {
    if (!activeBairro) { setNotice("Escolha primeiro o bairro atendido por esta rota."); return; }
    setSelectedCabos(eligibleCabos.map((cabo) => cabo.id));
    const teamLeaderIds = [...new Set(eligibleCabos.map((cabo) => cabo.lider_id).filter(Boolean))];
    const defaultLeader = teamLeaderIds.length === 1 ? teamLeaderIds[0] : activeBairro.lideres[0]?.id || "";
    setTaskForm({ lider_id: defaultLeader, data: today, turno: "Manhã", observacao: "" });
    setCreatedTask(null);
    setTaskOpen(true);
  }

  function toggleCabo(id) {
    setSelectedCabos((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function createFieldTask(event) {
    event.preventDefault();
    if (!taskForm.lider_id) { setNotice("Escolha a liderança responsável pela equipe."); return; }
    if (!selectedCabos.length) { setNotice("Selecione pelo menos um cabo responsável."); return; }
    try {
      const response = await fetch("/api/tarefas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rota_id: active.id, bairro_id: active.bairro_id, lider_id: Number(taskForm.lider_id), data: taskForm.data, turno: taskForm.turno, observacao: taskForm.observacao, cabo_ids: selectedCabos }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível criar o planejamento");
      setCreatedTask(result);
      setTaskOpen(false);
      setNotice("Plano de campo criado. O link já pode ser enviado à equipe.");
      await onChanged();
    } catch (error) { setNotice(error.message); }
  }

  async function shareMapsLinks() {
    if (!active || active.pontos.length < 2) return;
    const links = googleMapsSegments(active.pontos);
    const text = links.length === 1 ? `Rota ${active.nome}` : `Rota ${active.nome} dividida em ${links.length} trechos:\n${links.map((link, index) => `Trecho ${index + 1}: ${link}`).join("\n")}`;
    try {
      if (navigator.share) {
        await navigator.share(links.length === 1 ? { title: active.nome, text, url: links[0] } : { title: active.nome, text });
        setShareNotice("Rota compartilhada.");
      } else {
        await navigator.clipboard.writeText(links.length === 1 ? links[0] : text);
        setShareNotice(links.length === 1 ? "Link copiado." : "Links dos trechos copiados.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") setShareNotice("Não foi possível compartilhar. Use o botão para abrir no Maps.");
    }
  }

  const distance = active?.pontos.length > 1 ? `${totalDistance(active.pontos).toFixed(2)} km` : "—";
  const googleMapsLinks = finalized && active?.pontos.length > 1 ? googleMapsSegments(active.pontos) : [];

  return (
    <div className="route-planner">
      <div className="section-toolbar route-toolbar">
        <div><span className="eyebrow">Editor visual</span><h2>Desenho de rotas · {cidade.nome}</h2><p>Crie a rota como em um canvas: cada clique adiciona um ponto e uma linha reta liga o percurso.</p></div>
        <form className="inline-create route-create" onSubmit={createRoute}><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome da nova rota" /><select value={bairroId} onChange={(event) => setBairroId(event.target.value)} aria-label="Bairro da rota"><option value="">Escolha o bairro</option>{bairros.map((bairro) => <option key={bairro.id} value={bairro.id}>{bairro.nome}</option>)}</select><button className="primary-button">+ Criar rota</button></form>
      </div>
      <div className="route-layout">
        <aside className="route-panel">
          <label><span>Rota em edição</span><select value={activeId || ""} onChange={(event) => selectRoute(event.target.value)}><option value="">Escolha uma rota</option>{cidade.rotas.map((route) => <option key={route.id} value={route.id}>{route.nome}</option>)}</select></label>
          {active ? <>
            <label className="route-area-select"><span>Território atendido</span><select value={active.bairro_id || ""} onChange={(event) => updateRouteArea(event.target.value)}><option value="">Escolha o bairro</option>{bairros.map((bairro) => <option key={bairro.id} value={bairro.id}>{bairro.nome}</option>)}</select></label>
            <div className="route-status-row"><span className={`route-status ${finalized ? "finished" : "draft"}`}><i />{finalized ? "Finalizada" : "Em desenho"}</span><span>{active.pontos.length} pontos</span></div>
            <div className="route-stats"><div><strong>{distance}</strong><span>linha total</span></div><div><strong>{Math.max(0, active.pontos.length - 1)}</strong><span>segmentos</span></div><div><strong>{finalized ? "Sim" : "Não"}</strong><span>chegada</span></div></div>

            <div className="draw-steps"><div className={active.pontos.length ? "done" : "active"}><span>1</span><p><strong>Partida</strong><small>Primeiro clique</small></p></div><div className={active.pontos.length > 1 ? "done" : active.pontos.length ? "active" : ""}><span>2</span><p><strong>Percurso</strong><small>Quantos pontos quiser</small></p></div><div className={finalized ? "done" : active.pontos.length ? "active" : ""}><span>3</span><p><strong>Chegada</strong><small>Último clique</small></p></div></div>

            {!active.pontos.length ? <button className={`draw-button start${drawMode === "start" ? " active" : ""}`} onClick={() => { setDrawMode("start"); setNotice("Clique no mapa para marcar o ponto de partida."); }}><span>●</span> Marcar ponto de partida</button> : finalized ? <button className="draw-button reopen" onClick={reopenRoute}><span>↺</span> Reabrir e continuar desenho</button> : <div className="draw-actions"><button className={`draw-button${drawMode === "waypoint" ? " active" : ""}`} onClick={() => { setDrawMode("waypoint"); setNotice("Clique no mapa para adicionar pontos intermediários."); }}><span>＋</span> Adicionar pontos</button><button className={`draw-button finish${drawMode === "finish" ? " active" : ""}`} onClick={() => { setDrawMode("finish"); setNotice("Clique no mapa no local exato da chegada."); }}><span>■</span> Marcar chegada</button></div>}

            <div className={`map-instruction ${drawMode !== "idle" ? "active" : ""}`}><span>{drawMode === "start" ? "1" : drawMode === "finish" ? "3" : drawMode === "waypoint" ? "2" : "⌖"}</span><p>{drawMode === "start" ? "Clique no mapa para definir a partida" : drawMode === "finish" ? "Clique no mapa para finalizar a rota" : drawMode === "waypoint" ? "Clique no mapa para desenhar o percurso" : finalized ? "Rota concluída" : "Escolha uma ação acima"}</p></div>

            <div className="stops-list"><div className="mini-heading"><span>Pontos do desenho</span><small>Ordem do percurso</small></div>{active.pontos.map((point, index) => { const isStart = index === 0; const isEnd = finalized && index === active.pontos.length - 1; return <div key={point.id} className={isStart ? "start" : isEnd ? "end" : ""}><span>{isStart ? "A" : isEnd ? "B" : index}</span><p><strong>{isStart ? "Ponto de partida" : isEnd ? "Ponto de chegada" : `Ponto intermediário ${index}`}</strong><small>{Number(point.lat).toFixed(5)}, {Number(point.lng).toFixed(5)}</small></p><button className="icon-button small" onClick={() => removePoint(point.id)} aria-label={`Remover ${isStart ? "partida" : isEnd ? "chegada" : `ponto ${index}`}`}>×</button></div>; })}{!active.pontos.length ? <p className="quiet-empty">O desenho ainda está vazio.</p> : null}</div>

            {googleMapsLinks.length ? <div className="maps-share-card"><div className="maps-share-heading"><span className="maps-mark">G</span><p><strong>Compartilhar no Google Maps</strong><small>O Maps seguirá os pontos pela malha de ruas.</small></p></div><div className="maps-links">{googleMapsLinks.map((link, index) => <a key={`${index}-${link}`} href={link} target="_blank" rel="noreferrer">{googleMapsLinks.length === 1 ? "Abrir rota no Google Maps" : `Abrir trecho ${index + 1}`} <span>↗</span></a>)}</div><button className="share-route-button" onClick={shareMapsLinks}><span>↗</span> Compartilhar {googleMapsLinks.length === 1 ? "link" : `${googleMapsLinks.length} links`}</button>{googleMapsLinks.length > 1 ? <p className="maps-limit-note">A rota foi dividida para funcionar também no celular.</p> : null}{shareNotice ? <p className="share-feedback">{shareNotice}</p> : null}</div> : finalized ? null : active.pontos.length > 1 ? <p className="maps-draft-note">Finalize a rota para gerar o link do Google Maps.</p> : null}

            {finalized ? <button className="field-task-trigger" onClick={openTaskForm}><span>✓</span><p><strong>Transformar em plano de campo</strong><small>Definir data, cabos e gerar link</small></p><i>→</i></button> : null}
            {taskOpen ? <form className="field-task-form" onSubmit={createFieldTask}>
              <div className="field-task-head"><div><span className="eyebrow">Novo plano de campo</span><h3>{active.nome}</h3><p>{activeBairro?.nome}</p></div><button type="button" onClick={() => setTaskOpen(false)}>×</button></div>
              <label className="task-leader-select"><span>Liderança responsável</span><select value={taskForm.lider_id} onChange={(event) => setTaskForm({ ...taskForm, lider_id: event.target.value })} required><option value="">Escolha quem responde pela equipe</option>{eligibleLeaders.map((lider) => <option key={lider.id} value={lider.id}>{lider.nome}{activeBairro?.lideres.some((item) => item.id === lider.id) ? " · atua neste bairro" : ""}</option>)}</select><small>Essa pessoa aparece como referência no link enviado aos cabos.</small></label>
              <div className="field-task-fields"><label><span>Data</span><input type="date" min={today} value={taskForm.data} onChange={(event) => setTaskForm({ ...taskForm, data: event.target.value })} required /></label><label><span>Turno</span><select value={taskForm.turno} onChange={(event) => setTaskForm({ ...taskForm, turno: event.target.value })}><option>Manhã</option><option>Tarde</option><option>Noite</option><option>Dia inteiro</option></select></label></div>
              <div className="task-team-picker"><div><strong>Cabos escalados</strong><small>Equipe cadastrada em {activeBairro?.nome}</small></div>{eligibleCabos.length ? eligibleCabos.map((cabo) => <label key={cabo.id}><input type="checkbox" checked={selectedCabos.includes(cabo.id)} onChange={() => toggleCabo(cabo.id)} /><span>{cabo.nome.slice(0, 2).toUpperCase()}</span><p><strong>{cabo.nome}</strong><small>{cidade.lideres.find((lider) => lider.id === cabo.lider_id)?.nome ? `Equipe de ${cidade.lideres.find((lider) => lider.id === cabo.lider_id).nome}` : cabo.contato || "Sem liderança vinculada"}</small></p><i>✓</i></label>) : <p className="task-no-team">Este bairro ainda não possui cabos cadastrados.</p>}</div>
              <label className="task-instructions"><span>Orientações para a equipe</span><textarea value={taskForm.observacao} onChange={(event) => setTaskForm({ ...taskForm, observacao: event.target.value })} placeholder="Ex.: levar material e cobrir todas as ruas indicadas no mapa." rows="3" /></label>
              <button className="primary-button task-submit" disabled={!eligibleCabos.length || !eligibleLeaders.length}>Criar plano e gerar link</button>
            </form> : null}
            {createdTask ? <div className="task-created"><span>✓</span><p><strong>Planejamento criado</strong><small>{createdTask.lider_nome} · {createdTask.cabos.length} cabos · {createdTask.data}</small></p><a href={`/campo/${createdTask.token}`} target="_blank" rel="noreferrer">Abrir link ↗</a></div> : null}

            {active.pontos.length ? <div className="route-secondary-actions"><button className="secondary-button" onClick={undoLastPoint}>Desfazer último ponto</button><button className="danger-link" onClick={clearDrawing}>Limpar desenho</button></div> : null}
            <button className="danger-link full" onClick={removeRoute}>Excluir esta rota</button>
          </> : <div className="route-empty"><span>⌖</span><p>Crie uma rota para começar o desenho sobre o mapa.</p></div>}
          {notice ? <p className="route-notice">{notice}</p> : null}
        </aside>
        <div className={`street-map route-canvas ${drawMode !== "idle" ? "drawing" : ""}`} ref={mapNode} aria-label={`Mapa para desenhar rotas em ${cidade.nome}`} />
      </div>
    </div>
  );
}
