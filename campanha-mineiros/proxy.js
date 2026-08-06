// Proxy (o que ate o Next 15 se chamava middleware): renova a sessao a cada
// requisicao e barra quem nao esta logado.
//
// Publico so o plano de campo, que a equipe de rua abre por link com token.
// Todo o resto — paginas e rotas de API — exige login.
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { estaAutorizado } from "./lib/acesso.js";

const ROTAS_PUBLICAS = [/^\/login$/, /^\/campo\//, /^\/api\/campo\//];

function ehPublica(caminho) {
  return ROTAS_PUBLICAS.some((padrao) => padrao.test(caminho));
}

export async function proxy(request) {
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (novos) => {
          for (const { name, value } of novos) request.cookies.set(name, value);
          resposta = NextResponse.next({ request });
          for (const { name, value, options } of novos) resposta.cookies.set(name, value, options);
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Estar logado nao basta: o e-mail precisa estar na lista de acesso.
  // Sem isso, qualquer conta criada no Supabase entraria no painel.
  const liberado = user ? await estaAutorizado(user.email) : false;

  if (!liberado && !ehPublica(pathname)) {
    // API responde 401; navegacao vai para o login e volta depois.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Faça login para continuar" }, { status: 401 });
    }
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    // Logado mas fora da lista: avisa em vez de mandar logar de novo.
    if (user) login.searchParams.set("erro", "sem-acesso");
    else login.searchParams.set("proxima", pathname);
    return NextResponse.redirect(login);
  }

  // Quem ja esta liberado nao precisa ver a tela de login. Quem esta logado
  // mas fora da lista precisa ver, para receber o aviso e poder sair.
  if (liberado && pathname === "/login") {
    const inicio = request.nextUrl.clone();
    inicio.pathname = "/";
    inicio.search = "";
    return NextResponse.redirect(inicio);
  }

  return resposta;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
