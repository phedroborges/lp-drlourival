// Cliente de sessao no servidor: le o cookie de login com a chave publicavel.
// Serve so para saber QUEM esta logado — o dado da campanha continua saindo
// do supabaseAdmin, depois que a sessao foi conferida.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function criarClienteServidor() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (novos) => {
          try {
            for (const { name, value, options } of novos) cookieStore.set(name, value, options);
          } catch {
            // Server Component nao pode escrever cookie. O proxy.js ja renova
            // a sessao antes de a pagina renderizar, entao aqui e so ignorar.
          }
        },
      },
    }
  );
}

// getUser() valida o token no servidor da Supabase. Nao usar getSession(),
// que confia no cookie sem verificar assinatura.
export async function getUsuario() {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}

// Barreira das rotas de API: o proxy ja redireciona a navegacao, mas cada
// rota confere de novo para nao depender so dele.
export async function exigirUsuario() {
  const usuario = await getUsuario();
  if (!usuario) {
    throw Object.assign(new Error("Faça login para continuar"), { status: 401 });
  }
  return usuario;
}
