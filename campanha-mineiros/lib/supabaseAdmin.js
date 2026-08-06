// Cliente com a secret key: ignora RLS e roda SOMENTE no servidor.
// As tabelas negam anon e authenticated no Postgres, entao esta e a unica
// porta de entrada para o dado da campanha — nenhuma query sai do navegador.
import { createClient } from "@supabase/supabase-js";

let cliente = null;

function obterCliente() {
  if (cliente) return cliente;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SECRET_KEY no ambiente."
    );
  }
  cliente = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}

// O cliente so nasce na primeira consulta. Se ele fosse criado na importacao,
// o `next build` quebraria: ele importa todas as rotas para coletar os dados
// de pagina, e a secret key so existe em runtime (no build do Docker ela nao
// esta presente, de proposito).
export const admin = new Proxy({}, {
  get(_alvo, propriedade) {
    const real = obterCliente();
    const valor = real[propriedade];
    return typeof valor === "function" ? valor.bind(real) : valor;
  },
});

// PostgREST devolve { data, error }; aqui o erro vira exceção para as rotas
// de API tratarem num lugar só.
export function ok({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}
