import { createCabo, updateCabo, deleteCabo } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json();
  if (!body?.nome || !String(body.nome).trim()) {
    return Response.json({ error: "Nome é obrigatório" }, { status: 400 });
  }
  if (!body?.bairro_id) {
    return Response.json({ error: "bairro_id é obrigatório" }, { status: 400 });
  }
  return Response.json(createCabo(body), { status: 201 });
}

export async function PATCH(request) {
  const body = await request.json();
  if (!body?.id) return Response.json({ error: "id é obrigatório" }, { status: 400 });
  return Response.json(updateCabo(body));
}

export async function DELETE(request) {
  const body = await request.json();
  if (!body?.id) return Response.json({ error: "id é obrigatório" }, { status: 400 });
  deleteCabo(body.id);
  return Response.json({ ok: true });
}
