"use client";
import { useEffect, useRef, useState } from "react";

const MINEIROS_CENTER = [-17.5653879, -52.5536721];

export default function RoutePlanner({ cidade, onChanged }) {
  const mapNode = useRef(null);
  const leaflet = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const [activeId, setActiveId] = useState(cidade.rotas[0]?.id || null);
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("");
  const active = cidade.rotas.find((route) => route.id === activeId) || null;

  async function api(method, body) {
    const response = await fetch("/api/rotas", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error((await response.json()).error || "Não foi possível salvar");
    return response.json();
  }

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((module) => {
      if (cancelled || !mapNode.current || map.current) return;
      const L = module.default;
      leaflet.current = L;
      map.current = L.map(mapNode.current, { zoomControl: true }).setView(MINEIROS_CENTER, 14);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(map.current);
      layer.current = L.layerGroup().addTo(map.current);
      map.current.on("click", async (event) => {
        const currentId = Number(mapNode.current?.dataset.activeId);
        if (!currentId) { setNotice("Crie ou escolha uma rota antes de marcar as paradas."); return; }
        await api("POST", { tipo: "ponto", rota_id: currentId, label: "Nova parada", lat: event.latlng.lat, lng: event.latlng.lng });
        onChanged();
      });
    });
    return () => { cancelled = true; if (map.current) { map.current.remove(); map.current = null; } };
  }, []);

  useEffect(() => { if (mapNode.current) mapNode.current.dataset.activeId = activeId || ""; }, [activeId]);

  useEffect(() => {
    if (!leaflet.current || !layer.current) return;
    const L = leaflet.current;
    layer.current.clearLayers();
    if (!active) return;
    active.pontos.forEach((point, index) => L.circleMarker([point.lat, point.lng], { radius: 9, color: "#fff", weight: 3, fillColor: "#ff5b2d", fillOpacity: 1 }).bindTooltip(`${index + 1}. ${point.label || "Parada"}`).addTo(layer.current));
    if (active.geometria) L.geoJSON(active.geometria, { style: { color: "#2556a5", weight: 6, opacity: .85 } }).addTo(layer.current);
    if (active.pontos.length) map.current.fitBounds(L.latLngBounds(active.pontos.map((point) => [point.lat, point.lng])).pad(.18), { maxZoom: 16 });
  }, [active]);

  async function createRoute(event) { event.preventDefault(); if (!name.trim()) return; const route = await api("POST", { municipio_codigo: cidade.codigo, nome }); setName(""); setActiveId(route.id); await onChanged(); }
  async function calculate() {
    if (!active || active.pontos.length < 2) { setNotice("Marque pelo menos duas paradas no mapa."); return; }
    setNotice("Traçando o melhor caminho pelas ruas…");
    const response = await fetch("/api/rotas/calcular", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pontos: active.pontos }) });
    const result = await response.json();
    if (!response.ok) { setNotice(result.error); return; }
    await api("PATCH", { id: active.id, ...result });
    setNotice(result.aviso || "Rota atualizada pelas ruas da cidade.");
    onChanged();
  }
  async function removePoint(id) { await api("DELETE", { tipo: "ponto", id }); onChanged(); }
  async function removeRoute() { if (!active || !confirm(`Excluir a rota “${active.nome}”?`)) return; await api("DELETE", { id: active.id }); setActiveId(null); onChanged(); }

  const distance = active?.distancia_m ? `${(active.distancia_m / 1000).toFixed(1)} km` : "—";
  const duration = active?.duracao_s ? `${Math.round(active.duracao_s / 60)} min` : "—";

  return (
    <div className="route-planner">
      <div className="section-toolbar"><div><h2>Rotas de rua · {cidade.nome}</h2><p>Clique diretamente no mapa para incluir cada parada. Depois, trace o caminho pelas ruas.</p></div><form className="inline-create" onSubmit={createRoute}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da nova rota" /><button className="primary-button">+ Criar rota</button></form></div>
      <div className="route-layout">
        <aside className="route-panel">
          <label><span>Rota em edição</span><select value={activeId || ""} onChange={(e) => setActiveId(Number(e.target.value) || null)}><option value="">Escolha uma rota</option>{cidade.rotas.map((route) => <option key={route.id} value={route.id}>{route.nome}</option>)}</select></label>
          {active ? <><div className="route-stats"><div><strong>{distance}</strong><span>distância</span></div><div><strong>{duration}</strong><span>estimativa</span></div><div><strong>{active.pontos.length}</strong><span>paradas</span></div></div><div className="stops-list"><div className="mini-heading"><span>Sequência de paradas</span><small>Clique no mapa para adicionar</small></div>{active.pontos.map((point, index) => <div key={point.id}><span>{index + 1}</span><p><strong>{point.label || `Parada ${index + 1}`}</strong><small>{point.bairro_nome || `${Number(point.lat).toFixed(5)}, ${Number(point.lng).toFixed(5)}`}</small></p><button className="icon-button small" onClick={() => removePoint(point.id)} aria-label="Remover parada">×</button></div>)}{!active.pontos.length ? <p className="quiet-empty">Nenhuma parada. Clique em um endereço no mapa.</p> : null}</div><button className="primary-button full" onClick={calculate}>Traçar caminho pelas ruas</button><button className="danger-link full" onClick={removeRoute}>Excluir esta rota</button></> : <div className="route-empty"><span>⌖</span><p>Crie uma rota para começar a marcar os pontos da equipe.</p></div>}
          {notice ? <p className="route-notice">{notice}</p> : null}
        </aside>
        <div className="street-map" ref={mapNode} aria-label={`Mapa de ruas de ${cidade.nome}`} />
      </div>
    </div>
  );
}
