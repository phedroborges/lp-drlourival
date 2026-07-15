import { getEstrategias, createEstrategia, updateEstrategia, deleteEstrategia, importEstrategias } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getEstrategias());
}

export async function POST(request) {
  const body = await request.json();
  if (Array.isArray(body)) return Response.json(importEstrategias(body)); // importação em lote
  return Response.json(createEstrategia(body || {}), { status: 201 });
}

export async function PATCH(request) {
  const body = await request.json();
  if (!body?.id) return Response.json({ error: "id é obrigatório" }, { status: 400 });
  return Response.json(updateEstrategia(body));
}

export async function DELETE(request) {
  const body = await request.json();
  if (!body?.id) return Response.json({ error: "id é obrigatório" }, { status: 400 });
  deleteEstrategia(body.id);
  return Response.json({ ok: true });
}
