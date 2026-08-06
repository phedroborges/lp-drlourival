import {
  createRota,
  createRotaPonto,
  deleteRota,
  deleteRotaPonto,
  getRotas,
  updateRota,
  updateRotaPonto,
} from "@/lib/db";
import { protegida } from "@/lib/rota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = protegida(async (request) => {
  const codigo = Number(new URL(request.url).searchParams.get("codigo"));
  if (!codigo) return Response.json({ error: "Código obrigatório" }, { status: 400 });
  return Response.json(await getRotas(codigo));
});

export const POST = protegida(async (request) => {
  const body = await request.json();
  if (body.tipo === "ponto") {
    if (!body.rota_id || !Number.isFinite(Number(body.lat)) || !Number.isFinite(Number(body.lng))) {
      return Response.json({ error: "Rota e coordenadas são obrigatórias" }, { status: 400 });
    }
    return Response.json(await createRotaPonto(body), { status: 201 });
  }
  if (!body.municipio_codigo || !String(body.nome || "").trim()) {
    return Response.json({ error: "Município e nome são obrigatórios" }, { status: 400 });
  }
  return Response.json(await createRota(body), { status: 201 });
});

export const PATCH = protegida(async (request) => {
  const body = await request.json();
  if (!body.id) return Response.json({ error: "ID obrigatório" }, { status: 400 });
  return Response.json(body.tipo === "ponto" ? await updateRotaPonto(body) : await updateRota(body));
});

export const DELETE = protegida(async (request) => {
  const body = await request.json();
  if (!body.id) return Response.json({ error: "ID obrigatório" }, { status: 400 });
  if (body.tipo === "ponto") await deleteRotaPonto(body.id);
  else await deleteRota(body.id);
  return Response.json({ ok: true });
});
