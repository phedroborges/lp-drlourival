/**
 * Recebe o formulário de apoio (nome, WhatsApp, cidade, bairro).
 *
 * Os dados alimentam a base de apoiadores da campanha com consentimento
 * (regra 7 do briefing). O destino é um webhook do n8n definido na
 * variável de ambiente N8N_WEBHOOK_APOIO — no EasyPanel, configurar em
 * Environment. Enquanto a variável não existir, o envio é apenas
 * registrado no log do servidor (não perde silenciosamente em produção:
 * configurar o webhook antes do lançamento).
 */
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
    data: new Date().toISOString(),
  };

  const webhook = process.env.N8N_WEBHOOK_APOIO;
  if (webhook) {
    const resp = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registro),
    });
    if (!resp.ok) {
      console.error("Falha ao enviar apoio ao n8n:", resp.status);
      return Response.json({ ok: false }, { status: 502 });
    }
  } else {
    // TODO: configurar N8N_WEBHOOK_APOIO no EasyPanel antes do lançamento
    console.log("[apoio recebido — webhook não configurado]", registro);
  }

  return Response.json({ ok: true });
}
