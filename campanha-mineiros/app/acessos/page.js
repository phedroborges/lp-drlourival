"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { InitialsAvatar } from "@/components/ui/initials-avatar";

const VAZIO = { nome: "", email: "", senha: "", admin: false };

function quando(valor) {
  if (!valor) return "nunca entrou";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  }).format(new Date(valor));
}

async function pedir(metodo, corpo) {
  const resposta = await fetch("/api/usuarios", {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const resultado = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(resultado.error || "Não foi possível concluir a ação");
  return resultado;
}

export default function AcessosPage() {
  const [pessoas, setPessoas] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [senhaGerada, setSenhaGerada] = useState(null);
  const [confirmar, setConfirmar] = useState(null);

  const recarregar = useCallback(async () => {
    const resposta = await fetch("/api/usuarios", { cache: "no-store" });
    if (resposta.status === 403) { setPessoas("sem-permissao"); return; }
    const lista = await resposta.json().catch(() => []);
    setPessoas(Array.isArray(lista) ? lista : []);
  }, []);

  useEffect(() => { recarregar(); }, [recarregar]);

  async function executar(acao) {
    try {
      setErro("");
      const resultado = await acao();
      await recarregar();
      return resultado;
    } catch (motivo) {
      setErro(motivo.message);
      return null;
    }
  }

  async function criar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setSenhaGerada(null);
    const resultado = await executar(() => pedir("POST", form));
    if (resultado) {
      setForm(VAZIO);
      if (resultado.senha) setSenhaGerada({ email: resultado.email, senha: resultado.senha });
    }
    setSalvando(false);
  }

  if (pessoas === "sem-permissao") {
    return (
      <main className="command-page">
        <div className="empty-state">
          <h2>Área restrita</h2>
          <p className="hint">Só a coordenação pode gerenciar quem entra no painel.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="command-page">
      <span className="eyebrow">Controle de acesso</span>
      <h1 className="page-title">Quem entra no painel</h1>
      <p className="page-sub">
        Criar a pessoa aqui já faz as duas coisas: abre a conta de login e libera o
        acesso. Tirar daqui derruba na hora, mesmo que ela esteja com o painel aberto.
      </p>

      {erro ? <div className="error-banner">{erro}<button onClick={() => setErro("")}>×</button></div> : null}

      {senhaGerada ? (
        <div className="senha-gerada">
          <div>
            <strong>Senha de {senhaGerada.email}</strong>
            <small>Anote agora: ela não fica guardada e não dá para ver de novo.</small>
          </div>
          <code>{senhaGerada.senha}</code>
          <button type="button" onClick={() => setSenhaGerada(null)}>×</button>
        </div>
      ) : null}

      <form className="card acesso-form" onSubmit={criar}>
        <div className="form-grid two">
          <Label className="flex-col items-start gap-1">
            Nome
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Como aparece na equipe" />
          </Label>
          <Label className="flex-col items-start gap-1">
            E-mail *
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="pessoa@exemplo.com.br" />
          </Label>
          <Label className="flex-col items-start gap-1">
            Senha
            <Input value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} placeholder="Deixe vazio para gerar uma" />
          </Label>
          <label className="acesso-admin">
            <input type="checkbox" checked={form.admin} onChange={(e) => setForm({ ...form, admin: e.target.checked })} />
            <span><strong>Pode gerenciar acessos</strong><small>Cria e remove outras pessoas</small></span>
          </label>
        </div>
        <Button type="submit" disabled={salvando || !form.email.trim()}>
          {salvando ? <><Spinner /> Criando…</> : "+ Liberar acesso"}
        </Button>
      </form>

      {pessoas === null ? (
        <div className="empty"><Spinner /></div>
      ) : (
        <div className="acesso-lista">
          {pessoas.map((pessoa) => (
            <article key={pessoa.email} className="acesso-card">
              <InitialsAvatar name={pessoa.nome || pessoa.email} />
              <div className="acesso-identidade">
                <strong>{pessoa.nome || pessoa.email}</strong>
                <small>{pessoa.email}</small>
                <span className="acesso-meta">
                  {pessoa.tem_conta ? `Último acesso: ${quando(pessoa.ultimo_acesso)}` : "Conta de login não encontrada"}
                </span>
              </div>
              {pessoa.admin ? <span className="acesso-badge">Coordenação</span> : null}
              <div className="acesso-acoes">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => executar(() => pedir("PATCH", { email: pessoa.email, admin: !pessoa.admin }))}
                >
                  {pessoa.admin ? "Tirar administração" : "Tornar administrador"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    const resultado = await executar(() => pedir("PATCH", { email: pessoa.email, senha: "" }));
                    if (resultado?.senha) setSenhaGerada(resultado);
                  }}
                >
                  Nova senha
                </Button>
                <Button type="button" variant="destructive" onClick={() => setConfirmar(pessoa)}>
                  Remover
                </Button>
              </div>
            </article>
          ))}
          {!pessoas.length ? <div className="empty">Ninguém liberado ainda.</div> : null}
        </div>
      )}

      <ConfirmDeleteDialog
        open={Boolean(confirmar)}
        onOpenChange={(aberto) => { if (!aberto) setConfirmar(null); }}
        title={`Remover o acesso de ${confirmar?.nome || confirmar?.email}?`}
        description="A conta de login também é apagada. A pessoa perde o acesso imediatamente."
        onConfirm={async () => {
          await executar(() => pedir("DELETE", { email: confirmar.email }));
          setConfirmar(null);
        }}
      />
    </main>
  );
}
