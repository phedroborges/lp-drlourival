import { createOrcamentoItem, deleteOrcamentoItem, getOrcamento, updateOrcamentoConfig, updateOrcamentoItem } from "@/lib/db";
import { protegida } from "@/lib/rota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = protegida(async () => Response.json(await getOrcamento()));

export const PUT = protegida(async (request) =>
  Response.json(await updateOrcamentoConfig(await request.json()))
);

export const POST = protegida(async (request) =>
  Response.json(await createOrcamentoItem(await request.json()), { status: 201 })
);

export const PATCH = protegida(async (request) => {
  const body = await request.json();
  if (!body?.id) return Response.json({ error: "id é obrigatório" }, { status: 400 });
  return Response.json(await updateOrcamentoItem(body));
});

export const DELETE = protegida(async (request) => {
  const body = await request.json();
  if (!body?.id) return Response.json({ error: "id é obrigatório" }, { status: 400 });
  await deleteOrcamentoItem(body.id);
  return Response.json({ ok: true });
});
