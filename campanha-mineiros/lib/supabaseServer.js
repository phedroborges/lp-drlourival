// Cliente de sessao no servidor: le o cookie de login com a chave publicavel.
// Serve so para saber QUEM esta logado — o dado da campanha continua saindo
// do supabaseAdmin, depois que a sessao foi conferida.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { buscarAutorizacao } from "./acesso.js";

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
  if (error || !data.user) return null;
  const autorizacao = await buscarAutorizacao(data.user.email);
  if (!autorizacao) return null;
  // admin decide quem pode dar e tirar acesso das outras pessoas.
  return { ...data.user, admin: autorizacao.admin === true };
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

// Barreira da tela de Acessos: estar liberado não é o mesmo que poder liberar
// outras pessoas.
export async function exigirAdmin() {
  const usuario = await exigirUsuario();
  if (!usuario.admin) {
    throw Object.assign(new Error("Só a coordenação pode gerenciar acessos"), { status: 403 });
  }
  return usuario;
}
