import {
  createRota,
  createRotaPonto,
  deleteRota,
  deleteRotaPonto,
  getRotas,
  updateRota,
  updateRotaPonto,
} from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const codigo = Number(new URL(request.url).searchParams.get("codigo"));
  if (!codigo) return Response.json({ error: "Código obrigatório" }, { status: 400 });
  return Response.json(getRotas(codigo));
}

export async function POST(request) {
  const body = await request.json();
  if (body.tipo === "ponto") {
    if (!body.rota_id || !Number.isFinite(Number(body.lat)) || !Number.isFinite(Number(body.lng))) {
      return Response.json({ error: "Rota e coordenadas são obrigatórias" }, { status: 400 });
    }
    return Response.json(createRotaPonto(body), { status: 201 });
  }
  if (!body.municipio_codigo || !String(body.nome || "").trim()) {
    return Response.json({ error: "Município e nome são obrigatórios" }, { status: 400 });
  }
  return Response.json(createRota(body), { status: 201 });
}

export async function PATCH(request) {
  const body = await request.json();
  if (!body.id) return Response.json({ error: "ID obrigatório" }, { status: 400 });
  return Response.json(body.tipo === "ponto" ? updateRotaPonto(body) : updateRota(body));
}

export async function DELETE(request) {
  const body = await request.json();
  if (!body.id) return Response.json({ error: "ID obrigatório" }, { status: 400 });
  if (body.tipo === "ponto") deleteRotaPonto(body.id);
  else deleteRota(body.id);
  return Response.json({ ok: true });
}
