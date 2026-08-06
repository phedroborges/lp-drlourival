import { getTarefaByToken } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Unica rota sem login: a equipe de rua abre o plano pelo link com token.
// O token e um UUID gerado pelo banco e so da acesso a esse plano.
export async function GET(_request, { params }) {
  const { token } = await params;
  const tarefa = await getTarefaByToken(token);
  if (!tarefa) {
    return Response.json({ error: "Plano de campo não encontrado" }, { status: 404 });
  }
  return Response.json(tarefa);
}
