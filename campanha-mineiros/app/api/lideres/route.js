import { createLider, updateLider, deleteLider } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json();
  if (!body?.municipio_codigo) return Response.json({ error: "municipio_codigo é obrigatório" }, { status: 400 });
  if (!body?.nome || !String(body.nome).trim()) return Response.json({ error: "Nome é obrigatório" }, { status: 400 });
  return Response.json(createLider(body), { status: 201 });
}

export async function PATCH(request) {
  const body = await request.json();
  if (!body?.id) return Response.json({ error: "id é obrigatório" }, { status: 400 });
  return Response.json(updateLider(body));
}

export async function DELETE(request) {
  const body = await request.json();
  if (!body?.id) return Response.json({ error: "id é obrigatório" }, { status: 400 });
  deleteLider(body.id);
  return Response.json({ ok: true });
}
