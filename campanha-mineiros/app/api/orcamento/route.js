import { createOrcamentoItem, deleteOrcamentoItem, getOrcamento, updateOrcamentoConfig, updateOrcamentoItem } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getOrcamento());
}

export async function PUT(request) {
  try {
    return Response.json(updateOrcamentoConfig(await request.json()));
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    return Response.json(createOrcamentoItem(await request.json()), { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    if (!body?.id) return Response.json({ error: "id é obrigatório" }, { status: 400 });
    return Response.json(updateOrcamentoItem(body));
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  const body = await request.json();
  if (!body?.id) return Response.json({ error: "id é obrigatório" }, { status: 400 });
  deleteOrcamentoItem(body.id);
  return Response.json({ ok: true });
}
