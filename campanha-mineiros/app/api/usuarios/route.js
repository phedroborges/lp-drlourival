import { listarUsuarios, criarUsuario, atualizarUsuario, redefinirSenha, removerUsuario } from "@/lib/usuarios";
import { exigirAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Só administradores gerenciam acessos, então esta rota não usa o wrapper
// `protegida` (que exige apenas login).
function somenteAdmin(handler) {
  return async (request) => {
    try {
      const usuario = await exigirAdmin();
      return await handler(request, usuario);
    } catch (erro) {
      return Response.json(
        { error: erro.message || "Não foi possível concluir a ação" },
        { status: erro.status || 400 }
      );
    }
  };
}

const mesmaPessoa = (a, b) => String(a ?? "").toLowerCase() === String(b ?? "").toLowerCase();

export const GET = somenteAdmin(async () => Response.json(await listarUsuarios()));

export const POST = somenteAdmin(async (request) => {
  const body = await request.json();
  return Response.json(await criarUsuario(body || {}), { status: 201 });
});

export const PATCH = somenteAdmin(async (request, usuario) => {
  const body = await request.json();
  if (!body?.email) return Response.json({ error: "email é obrigatório" }, { status: 400 });

  if (body.senha !== undefined) {
    return Response.json(await redefinirSenha(body));
  }
  // Sem isso a coordenação conseguiria se rebaixar e ficar sem ninguém
  // podendo dar acesso.
  if (body.admin === false && mesmaPessoa(body.email, usuario.email)) {
    return Response.json({ error: "Você não pode remover a própria administração" }, { status: 400 });
  }
  return Response.json(await atualizarUsuario(body));
});

export const DELETE = somenteAdmin(async (request, usuario) => {
  const body = await request.json();
  if (!body?.email) return Response.json({ error: "email é obrigatório" }, { status: 400 });
  if (mesmaPessoa(body.email, usuario.email)) {
    return Response.json({ error: "Você não pode remover o próprio acesso" }, { status: 400 });
  }
  return Response.json(await removerUsuario(body.email));
});
