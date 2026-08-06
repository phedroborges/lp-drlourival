import { exigirUsuario } from "./supabaseServer.js";

// Envolve um handler de rota de API: confere a sessao antes de tocar no banco
// e transforma qualquer erro numa resposta JSON. O proxy.js ja barra quem nao
// esta logado, mas a rota nao depende so dele.
export function protegida(handler) {
  return async (request, contexto) => {
    try {
      await exigirUsuario();
      return await handler(request, contexto);
    } catch (erro) {
      return Response.json(
        { error: erro.message || "Não foi possível concluir a ação" },
        { status: erro.status || 400 }
      );
    }
  };
}
