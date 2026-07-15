export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const { pontos = [] } = await request.json();
  if (pontos.length < 2) {
    return Response.json({ error: "Adicione pelo menos duas paradas" }, { status: 400 });
  }

  const coordinates = pontos.map((p) => `${Number(p.lng)},${Number(p.lat)}`).join(";");
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`,
      { headers: { "User-Agent": "CampanhaMineiros/1.0" }, cache: "no-store" },
    );
    if (!response.ok) throw new Error(`OSRM ${response.status}`);
    const data = await response.json();
    const route = data.routes?.[0];
    if (!route) throw new Error("Rota não encontrada");
    return Response.json({
      geometria: route.geometry,
      distancia_m: route.distance,
      duracao_s: route.duration,
      aproximada: false,
    });
  } catch {
    return Response.json({
      geometria: { type: "LineString", coordinates: pontos.map((p) => [Number(p.lng), Number(p.lat)]) },
      distancia_m: 0,
      duracao_s: 0,
      aproximada: true,
      aviso: "O serviço de ruas não respondeu. Exibimos uma ligação aproximada entre as paradas.",
    });
  }
}
