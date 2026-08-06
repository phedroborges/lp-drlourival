// Quem pode entrar no painel.
//
// Ter conta no Supabase não basta: enquanto o cadastro público do projeto
// estiver aberto, qualquer pessoa cria uma conta e confirma o próprio e-mail.
// A tabela usuario_autorizado é o que decide de verdade — e é conferida a cada
// requisição, tanto no proxy quanto nas rotas de API.
//
// Consulta direta ao PostgREST em vez de supabase-js: este arquivo também é
// importado pelo proxy.js, que roda antes da aplicação.
const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET = process.env.SUPABASE_SECRET_KEY;

export async function estaAutorizado(email) {
  const alvo = String(email ?? "").trim().toLowerCase();
  if (!alvo || !URL_BASE || !SECRET) return false;

  const endereco = `${URL_BASE}/rest/v1/usuario_autorizado`
    + `?select=email&email=eq.${encodeURIComponent(alvo)}&limit=1`;

  try {
    const resposta = await fetch(endereco, {
      headers: { apikey: SECRET, Authorization: `Bearer ${SECRET}` },
      cache: "no-store",
    });
    if (!resposta.ok) return false;
    const linhas = await resposta.json();
    return Array.isArray(linhas) && linhas.length > 0;
  } catch {
    // Banco fora do ar nega o acesso em vez de liberar por omissão.
    return false;
  }
}
