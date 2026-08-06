import { createLider, updateLider, deleteLider } from "@/lib/db";
import { protegida } from "@/lib/rota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = protegida(async (request) => {
  const body = await request.json();
  if (!body?.municipio_codigo) return Response.json({ error: "municipio_codigo é obrigatório" }, { status: 400 });
  if (!body?.nome || !String(body.nome).trim()) return Response.json({ error: "Nome é obrigatório" }, { status: 400 });
  return Response.json(await createLider(body), { status: 201 });
});

export const PATCH = protegida(async (request) => {
  const body = await request.json();
  if (!body?.id) return Response.json({ error: "id é obrigatório" }, { status: 400 });
  return Response.json(await updateLider(body));
});

export const DELETE = protegida(async (request) => {
  const body = await request.json();
  if (!body?.id) return Response.json({ error: "id é obrigatório" }, { status: 400 });
  await deleteLider(body.id);
  return Response.json({ ok: true });
});
