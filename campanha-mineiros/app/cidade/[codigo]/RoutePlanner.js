"use client";
import { useEffect, useRef, useState } from "react";

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
  const [notice, setNotice] = useState("");
  const [drawMode, setDrawMode] = useState("idle");
  const active = cidade.rotas.find((route) => route.id === activeId) || null;
  const finalized = active?.status === "finalizada";

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
    if (!name.trim()) return;
    try {
      const route = await routeRequest("POST", { municipio_codigo: cidade.codigo, nome: name });
      setName("");
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
  }

  const distance = active?.pontos.length > 1 ? `${totalDistance(active.pontos).toFixed(2)} km` : "—";

  return (
    <div className="route-planner">
      <div className="section-toolbar route-toolbar">
        <div><span className="eyebrow">Editor visual</span><h2>Desenho de rotas · {cidade.nome}</h2><p>Crie a rota como em um canvas: cada clique adiciona um ponto e uma linha reta liga o percurso.</p></div>
        <form className="inline-create" onSubmit={createRoute}><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome da nova rota" /><button className="primary-button">+ Criar rota</button></form>
      </div>
      <div className="route-layout">
        <aside className="route-panel">
          <label><span>Rota em edição</span><select value={activeId || ""} onChange={(event) => selectRoute(event.target.value)}><option value="">Escolha uma rota</option>{cidade.rotas.map((route) => <option key={route.id} value={route.id}>{route.nome}</option>)}</select></label>
          {active ? <>
            <div className="route-status-row"><span className={`route-status ${finalized ? "finished" : "draft"}`}><i />{finalized ? "Finalizada" : "Em desenho"}</span><span>{active.pontos.length} pontos</span></div>
            <div className="route-stats"><div><strong>{distance}</strong><span>linha total</span></div><div><strong>{Math.max(0, active.pontos.length - 1)}</strong><span>segmentos</span></div><div><strong>{finalized ? "Sim" : "Não"}</strong><span>chegada</span></div></div>

            <div className="draw-steps"><div className={active.pontos.length ? "done" : "active"}><span>1</span><p><strong>Partida</strong><small>Primeiro clique</small></p></div><div className={active.pontos.length > 1 ? "done" : active.pontos.length ? "active" : ""}><span>2</span><p><strong>Percurso</strong><small>Quantos pontos quiser</small></p></div><div className={finalized ? "done" : active.pontos.length ? "active" : ""}><span>3</span><p><strong>Chegada</strong><small>Último clique</small></p></div></div>

            {!active.pontos.length ? <button className={`draw-button start${drawMode === "start" ? " active" : ""}`} onClick={() => { setDrawMode("start"); setNotice("Clique no mapa para marcar o ponto de partida."); }}><span>●</span> Marcar ponto de partida</button> : finalized ? <button className="draw-button reopen" onClick={reopenRoute}><span>↺</span> Reabrir e continuar desenho</button> : <div className="draw-actions"><button className={`draw-button${drawMode === "waypoint" ? " active" : ""}`} onClick={() => { setDrawMode("waypoint"); setNotice("Clique no mapa para adicionar pontos intermediários."); }}><span>＋</span> Adicionar pontos</button><button className={`draw-button finish${drawMode === "finish" ? " active" : ""}`} onClick={() => { setDrawMode("finish"); setNotice("Clique no mapa no local exato da chegada."); }}><span>■</span> Marcar chegada</button></div>}

            <div className={`map-instruction ${drawMode !== "idle" ? "active" : ""}`}><span>{drawMode === "start" ? "1" : drawMode === "finish" ? "3" : drawMode === "waypoint" ? "2" : "⌖"}</span><p>{drawMode === "start" ? "Clique no mapa para definir a partida" : drawMode === "finish" ? "Clique no mapa para finalizar a rota" : drawMode === "waypoint" ? "Clique no mapa para desenhar o percurso" : finalized ? "Rota concluída" : "Escolha uma ação acima"}</p></div>

            <div className="stops-list"><div className="mini-heading"><span>Pontos do desenho</span><small>Ordem do percurso</small></div>{active.pontos.map((point, index) => { const isStart = index === 0; const isEnd = finalized && index === active.pontos.length - 1; return <div key={point.id} className={isStart ? "start" : isEnd ? "end" : ""}><span>{isStart ? "A" : isEnd ? "B" : index}</span><p><strong>{isStart ? "Ponto de partida" : isEnd ? "Ponto de chegada" : `Ponto intermediário ${index}`}</strong><small>{Number(point.lat).toFixed(5)}, {Number(point.lng).toFixed(5)}</small></p><button className="icon-button small" onClick={() => removePoint(point.id)} aria-label={`Remover ${isStart ? "partida" : isEnd ? "chegada" : `ponto ${index}`}`}>×</button></div>; })}{!active.pontos.length ? <p className="quiet-empty">O desenho ainda está vazio.</p> : null}</div>

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
