/**
 * Recebe o formulário de apoio (nome, WhatsApp, cidade, bairro).
 *
 * O registro é gravado na tabela `apoiador` do Supabase, que é a base oficial
 * de apoiadores com consentimento (regra 7 do briefing). O webhook do n8n
 * continua sendo disparado quando N8N_WEBHOOK_APOIO existe, para manter as
 * automações — mas ele deixou de ser o único destino: se o n8n cair, o lead
 * não se perde.
 */
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let dados: Record<string, unknown>;
  try {
    dados = await request.json();
  } catch {
    return Response.json({ ok: false, erro: "corpo inválido" }, { status: 400 });
  }

  const nome = String(dados.nome ?? "").trim();
  const whatsapp = String(dados.whatsapp ?? "").trim();
  const cidade = String(dados.cidade ?? "").trim();
  const bairro = String(dados.bairro ?? "").trim();

  if (!nome || !whatsapp || !cidade || !bairro) {
    return Response.json(
      { ok: false, erro: "campos obrigatórios faltando" },
      { status: 400 },
    );
  }

  const registro = {
    nome,
    whatsapp,
    cidade,
    bairro,
    consentimento: true,
    origem: "site",
  };

  // Ambas são lidas só aqui, no servidor: nada disso chega ao navegador.
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    console.error("Supabase não configurado: apoio não foi gravado", registro);
    return Response.json({ ok: false }, { status: 500 });
  }

  const supabase = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.from("apoiador").insert(registro);
  if (error) {
    console.error("Falha ao gravar apoio no Supabase:", error.message);
    return Response.json({ ok: false }, { status: 500 });
  }

  // O n8n é complementar. Se ele falhar, o apoio já está salvo — responde ok
  // para a pessoa e deixa o erro no log para a coordenação reprocessar.
  const webhook = process.env.N8N_WEBHOOK_APOIO;
  if (webhook) {
    try {
      const resposta = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...registro, data: new Date().toISOString() }),
      });
      if (!resposta.ok) console.error("n8n recusou o apoio:", resposta.status);
    } catch (erro) {
      console.error("n8n indisponível:", erro);
    }
  }

  return Response.json({ ok: true });
}
