import { createTarefa, deleteTarefa, getTarefaByToken, getTarefas, updateTarefaCabo } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(error, status = 400) {
  return Response.json({ error: error.message || "Não foi possível concluir a ação" }, { status });
}

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const token = params.get("token");
  if (token) {
    const tarefa = getTarefaByToken(token);
    return tarefa ? Response.json(tarefa) : Response.json({ error: "Plano de campo não encontrado" }, { status: 404 });
  }
  const codigo = Number(params.get("codigo"));
  if (!codigo) return Response.json({ error: "Código da cidade é obrigatório" }, { status: 400 });
  return Response.json(getTarefas(codigo));
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.rota_id || !body.data || !Array.isArray(body.cabo_ids) || !body.cabo_ids.length) {
      return Response.json({ error: "Rota, data e pelo menos um cabo são obrigatórios" }, { status: 400 });
    }
    return Response.json(createTarefa(body), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    if (!body.token || !body.cabo_id || !body.status) {
      return Response.json({ error: "Plano, cabo e status são obrigatórios" }, { status: 400 });
    }
    return Response.json(updateTarefaCabo(body));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request) {
  const body = await request.json();
  if (!body.id) return Response.json({ error: "ID obrigatório" }, { status: 400 });
  deleteTarefa(body.id);
  return Response.json({ ok: true });
}
