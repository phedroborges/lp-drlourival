// Gestão de quem entra no painel.
//
// Cada pessoa precisa de duas coisas: uma conta no Supabase Auth (e-mail e
// senha) e uma linha em usuario_autorizado. Este arquivo cuida das duas de
// uma vez, para a coordenação não ter que abrir o dashboard do Supabase nem
// rodar SQL.
//
// Fala direto com a API de administração e com o PostgREST usando a secret
// key — nada disso pode acontecer no navegador.
const AUTH_ADMIN = "/auth/v1/admin/users";
const TABELA = "/rest/v1/usuario_autorizado";

function ambiente() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SECRET_KEY no ambiente.");
  }
  return { url, secret };
}

async function chamar(caminho, opcoes = {}) {
  const { url, secret } = ambiente();
  const resposta = await fetch(`${url}${caminho}`, {
    ...opcoes,
    headers: {
      apikey: secret,
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...(opcoes.headers || {}),
    },
    cache: "no-store",
  });
  const corpo = await resposta.text();
  const dados = corpo ? JSON.parse(corpo) : null;
  if (!resposta.ok) {
    throw new Error(dados?.msg || dados?.message || dados?.error_description || "Não foi possível concluir a ação");
  }
  return dados;
}

function normalizar(email) {
  return String(email ?? "").trim().toLowerCase();
}

/** Senha inicial legível, para a coordenação repassar por WhatsApp. */
function senhaSugerida() {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return `${[...bytes].map((n) => alfabeto[n % alfabeto.length]).join("")}!7`;
}

export async function listarUsuarios() {
  const [autorizados, contas] = await Promise.all([
    chamar(`${TABELA}?select=email,nome,admin,criado_em&order=nome`),
    chamar(`${AUTH_ADMIN}?per_page=200`),
  ]);

  const porEmail = new Map(
    (contas?.users || []).map((conta) => [normalizar(conta.email), conta])
  );

  return autorizados.map((pessoa) => {
    const conta = porEmail.get(pessoa.email);
    return {
      ...pessoa,
      tem_conta: Boolean(conta),
      ultimo_acesso: conta?.last_sign_in_at ?? null,
    };
  });
}

export async function criarUsuario({ email, nome = "", senha = "", admin = false }) {
  const alvo = normalizar(email);
  if (!alvo || !alvo.includes("@")) throw new Error("Informe um e-mail válido");

  const senhaFinal = String(senha || "").trim() || senhaSugerida();
  if (senhaFinal.length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres");

  // A conta pode já existir (alguém que se cadastrou sozinho, por exemplo).
  // Nesse caso só liberamos o acesso, sem trocar a senha por baixo dela.
  const existentes = await chamar(`${AUTH_ADMIN}?per_page=200`);
  const conta = (existentes?.users || []).find((item) => normalizar(item.email) === alvo);

  let senhaDefinida = false;
  if (!conta) {
    await chamar(AUTH_ADMIN, {
      method: "POST",
      body: JSON.stringify({ email: alvo, password: senhaFinal, email_confirm: true }),
    });
    senhaDefinida = true;
  }

  await chamar(TABELA, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ email: alvo, nome: String(nome || "").trim(), admin: Boolean(admin) }),
  });

  // A senha só volta quando fomos nós que a definimos, para ser repassada uma
  // única vez. Ela não fica guardada em lugar nenhum.
  return { email: alvo, senha: senhaDefinida ? senhaFinal : null };
}

export async function atualizarUsuario({ email, nome, admin }) {
  const alvo = normalizar(email);
  const alteracoes = {};
  if (nome !== undefined) alteracoes.nome = String(nome).trim();
  if (admin !== undefined) alteracoes.admin = Boolean(admin);
  if (!Object.keys(alteracoes).length) return null;

  const linhas = await chamar(`${TABELA}?email=eq.${encodeURIComponent(alvo)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(alteracoes),
  });
  return linhas?.[0] ?? null;
}

export async function redefinirSenha({ email, senha = "" }) {
  const alvo = normalizar(email);
  const nova = String(senha || "").trim() || senhaSugerida();
  if (nova.length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres");

  const contas = await chamar(`${AUTH_ADMIN}?per_page=200`);
  const conta = (contas?.users || []).find((item) => normalizar(item.email) === alvo);
  if (!conta) throw new Error("Esta pessoa ainda não tem conta");

  await chamar(`${AUTH_ADMIN}/${conta.id}`, {
    method: "PUT",
    body: JSON.stringify({ password: nova }),
  });
  return { email: alvo, senha: nova };
}

/** Tira o acesso e apaga a conta, para não deixar login órfão no projeto. */
export async function removerUsuario(email) {
  const alvo = normalizar(email);
  await chamar(`${TABELA}?email=eq.${encodeURIComponent(alvo)}`, { method: "DELETE" });

  const contas = await chamar(`${AUTH_ADMIN}?per_page=200`);
  const conta = (contas?.users || []).find((item) => normalizar(item.email) === alvo);
  if (conta) await chamar(`${AUTH_ADMIN}/${conta.id}`, { method: "DELETE" });
  return { ok: true };
}
