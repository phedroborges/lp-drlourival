"use client";
// Cliente do navegador: usado apenas para login e logout. Nenhuma consulta ao
// dado da campanha passa por aqui — as tabelas negam essa chave no Postgres.
import { createBrowserClient } from "@supabase/ssr";

export function criarClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
