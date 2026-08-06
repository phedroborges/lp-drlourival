import { protegida } from "@/lib/rota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Usada pela tela de login logo depois de autenticar: responde 200 se a conta
// está na lista de acesso e 401 se não está. Quem fica de fora é deslogado ali
// mesmo, em vez de entrar num painel que não carrega nada.
export const GET = protegida(async () => Response.json({ ok: true }));
