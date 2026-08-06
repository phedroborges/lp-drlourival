// Cliente com a secret key: ignora RLS e roda SOMENTE no servidor.
// As tabelas negam anon e authenticated no Postgres, entao esta e a unica
// porta de entrada para o dado da campanha — nenhuma query sai do navegador.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!url || !secret) {
  throw new Error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SECRET_KEY no ambiente."
  );
}

export const admin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// PostgREST devolve { data, error }; aqui o erro vira exceção para as rotas
// de API tratarem num lugar só.
export function ok({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}
