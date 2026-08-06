"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { criarClienteNavegador } from "@/lib/supabaseBrowser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

function FormularioLogin() {
  const router = useRouter();
  const proxima = useSearchParams().get("proxima") || "/";
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(evento) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);
    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) {
      setErro(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : "Não foi possível entrar. Tente de novo em instantes."
      );
      setEnviando(false);
      return;
    }
    // O cookie de sessao so chega ao servidor no proximo request: refresh
    // antes de navegar, senao o proxy manda de volta para o login.
    router.refresh();
    router.replace(proxima);
  }

  return (
    <form className="login-card" onSubmit={entrar}>
      <div className="login-brand">
        <span>L</span>
        <div>
          <strong>Dr. Lourival</strong>
          <small>Central de dados da campanha</small>
        </div>
      </div>

      <h1>Entrar</h1>
      <p className="hint">Acesso restrito à equipe da campanha.</p>

      <div className="login-field">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          value={email}
          autoComplete="username"
          required
          onChange={(evento) => setEmail(evento.target.value)}
        />
      </div>

      <div className="login-field">
        <Label htmlFor="senha">Senha</Label>
        <Input
          id="senha"
          type="password"
          value={senha}
          autoComplete="current-password"
          required
          onChange={(evento) => setSenha(evento.target.value)}
        />
      </div>

      {erro ? <p className="login-erro" role="alert">{erro}</p> : null}

      <Button type="submit" disabled={enviando} className="login-submit">
        {enviando ? <><Spinner /> Entrando…</> : "Entrar"}
      </Button>

      <p className="hint login-rodape">
        Perdeu a senha? Fale com a coordenação para gerar uma nova.
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="login-page">
      <Suspense fallback={<div className="login-card"><Spinner /></div>}>
        <FormularioLogin />
      </Suspense>
    </main>
  );
}
