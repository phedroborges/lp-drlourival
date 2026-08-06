import { getEstrategias, createEstrategia, updateEstrategia, deleteEstrategia, importEstrategias } from "@/lib/db";
import { protegida } from "@/lib/rota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = protegida(async () => Response.json(await getEstrategias()));

export const POST = protegida(async (request) => {
  const body = await request.json();
  if (Array.isArray(body)) return Response.json(await importEstrategias(body)); // importação em lote
  return Response.json(await createEstrategia(body || {}), { status: 201 });
});

export const PATCH = protegida(async (request) => {
  const body = await request.json();
  if (!body?.id) return Response.json({ error: "id é obrigatório" }, { status: 400 });
  return Response.json(await updateEstrategia(body));
});

export const DELETE = protegida(async (request) => {
  const body = await request.json();
  if (!body?.id) return Response.json({ error: "id é obrigatório" }, { status: 400 });
  await deleteEstrategia(body.id);
  return Response.json({ ok: true });
});
