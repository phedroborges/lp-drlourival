import { createTarefa, deleteTarefa, getTarefas, updateTarefaCabo } from "@/lib/db";
import { protegida } from "@/lib/rota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Consulta por token vive em /api/campo/[token], que e a unica rota publica.
export const GET = protegida(async (request) => {
  const codigo = Number(new URL(request.url).searchParams.get("codigo"));
  if (!codigo) return Response.json({ error: "Código da cidade é obrigatório" }, { status: 400 });
  return Response.json(await getTarefas(codigo));
});

export const POST = protegida(async (request) => {
  const body = await request.json();
  if (!body.rota_id || !body.lider_id || !body.data || !Array.isArray(body.cabo_ids) || !body.cabo_ids.length) {
    return Response.json({ error: "Rota, liderança, data e pelo menos um cabo são obrigatórios" }, { status: 400 });
  }
  return Response.json(await createTarefa(body), { status: 201 });
});

export const PATCH = protegida(async (request) => {
  const body = await request.json();
  if (!body.tarefa_id || !body.cabo_id || !body.status) {
    return Response.json({ error: "Plano, cabo e status são obrigatórios" }, { status: 400 });
  }
  return Response.json(await updateTarefaCabo(body));
});

export const DELETE = protegida(async (request) => {
  const body = await request.json();
  if (!body.id) return Response.json({ error: "ID obrigatório" }, { status: 400 });
  await deleteTarefa(body.id);
  return Response.json({ ok: true });
});
