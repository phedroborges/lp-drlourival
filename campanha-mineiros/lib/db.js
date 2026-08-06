// Acesso ao banco da campanha (Postgres no Supabase).
// Roda SOMENTE no servidor: usa a secret key, que ignora RLS.
//
// Estrutura: municipio -> lider (candidato / coordenacao / chefe_gabinete /
// lideranca) -> cabo. Nao existe bairro; o territorio e a propria cidade.
import { admin, ok } from "./supabaseAdmin.js";

// Ordem em que a hierarquia aparece nas listas.
const ORDEM_NIVEL = { candidato: 0, coordenacao: 1, chefe_gabinete: 2, lideranca: 3, apoiador: 4 };

// Candidato e coordenacao respondem pela campanha inteira, nao por uma cidade.
const NIVEIS_GLOBAIS = ["candidato", "coordenacao"];

const colacao = new Intl.Collator("pt-BR", { sensitivity: "base" });
const porNome = (a, b) => colacao.compare(a.nome || "", b.nome || "");

function tierOf(total) { return total === 0 ? 0 : total === 1 ? 1 : total <= 3 ? 2 : 3; }

function ehGlobal(nivel) { return NIVEIS_GLOBAIS.includes(nivel); }

// Monta o objeto de UPDATE apenas com os campos que vieram na requisicao.
// Ausente = mantem; null = limpa. Substitui os COALESCE do SQLite.
function patch(origem, campos) {
  const saida = {};
  for (const campo of campos) if (origem[campo] !== undefined) saida[campo] = origem[campo];
  return saida;
}

function texto(valor) { return String(valor ?? "").trim(); }

// O PostgREST enxerga o muitos-para-muitos por lider_tag sozinho.
const COM_TAGS = "*, tags:tag(id, nome, ordem)";

function ordenarTags(lider) {
  return { ...lider, tags: (lider.tags || []).sort((a, b) => a.ordem - b.ordem) };
}

async function trocarTags(lider_id, tag_ids) {
  ok(await admin.from("lider_tag").delete().eq("lider_id", lider_id));
  const novos = [...new Set((tag_ids || []).map(Number))].filter(Boolean);
  if (novos.length) {
    ok(await admin.from("lider_tag").insert(novos.map((tag_id) => ({ lider_id, tag_id }))));
  }
}

/* ------------------------- Tags ------------------------- */
export async function getTags() {
  return ok(await admin.from("tag").select("*").order("ordem").order("nome"));
}

// Deixa a coordenação criar uma tag nova na hora, sem depender de deploy.
export async function createTag({ nome }) {
  const limpo = texto(nome);
  if (!limpo) throw new Error("Informe o nome da tag");
  const existente = ok(
    await admin.from("tag").select("*").ilike("nome", limpo).maybeSingle()
  );
  if (existente) return existente;
  const ultima = ok(
    await admin.from("tag").select("ordem").order("ordem", { ascending: false }).limit(1).maybeSingle()
  );
  return ok(
    await admin.from("tag").insert({ nome: limpo, ordem: (ultima?.ordem ?? -1) + 1 }).select("*").single()
  );
}

/* ------------------------- Estado (mapa) ------------------------- */
export async function getEstado() {
  const linhas = ok(await admin.from("estado_resumo").select("*"));
  return linhas
    .sort(porNome)
    .map((linha) => {
      const total = linha.nLideres + linha.nCabos;
      return { ...linha, total, tier: tierOf(total) };
    });
}

/* ------------------------- Cidade ------------------------- */
export async function getMunicipio(codigo) {
  const municipio = ok(
    await admin.from("municipio").select("*").eq("codigo", codigo).maybeSingle()
  );
  if (!municipio) return null;

  const [lideres, cabos, rotas, tarefas] = await Promise.all([
    admin.from("lider").select(COM_TAGS)
      .or(`nivel.in.(${NIVEIS_GLOBAIS.join(",")}),municipio_codigo.eq.${codigo}`)
      .then(ok),
    admin.from("cabo").select("*").eq("municipio_codigo", codigo).then(ok),
    getRotas(codigo),
    getTarefas(codigo),
  ]);

  return {
    ...municipio,
    lideres: lideres
      .map((lider) => ({ ...ordenarTags(lider), escopo_global: ehGlobal(lider.nivel) ? 1 : 0 }))
      .sort((a, b) => (ORDEM_NIVEL[a.nivel] - ORDEM_NIVEL[b.nivel]) || porNome(a, b)),
    cabos: cabos.sort(porNome),
    rotas,
    tarefas,
  };
}

/* ------------------------- Lideranças ------------------------- */
export async function createLider(dados) {
  const global = ehGlobal(dados.nivel);
  const registro = {
    municipio_codigo: dados.municipio_codigo,
    nome: texto(dados.nome),
    contato: dados.contato ?? "",
    classificacao: dados.classificacao ?? "",
    observacao: dados.observacao ?? "",
    nivel: dados.nivel ?? "lideranca",
    responsavel_id: global ? null : (dados.responsavel_id || null),
    endereco: dados.endereco ?? "",
    lat: dados.lat ?? null,
    lng: dados.lng ?? null,
  };
  const criado = ok(await admin.from("lider").insert(registro).select("id").single());
  await trocarTags(criado.id, dados.tag_ids);
  return ordenarTags(ok(await admin.from("lider").select(COM_TAGS).eq("id", criado.id).single()));
}

export async function updateLider(dados) {
  const atual = ok(
    await admin.from("lider").select("nivel, municipio_codigo, responsavel_id")
      .eq("id", dados.id).maybeSingle()
  );
  if (!atual) throw new Error("Liderança não encontrada");

  const nivel = dados.nivel || atual.nivel;
  const global = ehGlobal(nivel);
  const alteracoes = patch(dados, [
    "nome", "contato", "classificacao", "observacao",
    "endereco", "lat", "lng",
  ]);
  alteracoes.nivel = nivel;
  // Quem responde pela campanha inteira nao troca de cidade nem tem chefe.
  alteracoes.municipio_codigo = global
    ? atual.municipio_codigo
    : (dados.municipio_codigo ?? atual.municipio_codigo);
  alteracoes.responsavel_id = global
    ? null
    : (dados.responsavel_id === undefined ? atual.responsavel_id : (dados.responsavel_id || null));
  if (alteracoes.nome !== undefined) alteracoes.nome = texto(alteracoes.nome);

  ok(await admin.from("lider").update(alteracoes).eq("id", dados.id));
  // Edição rápida no cartão não manda tag_ids; só troca quando o campo vem.
  if (Array.isArray(dados.tag_ids)) await trocarTags(dados.id, dados.tag_ids);
  return ordenarTags(ok(await admin.from("lider").select(COM_TAGS).eq("id", dados.id).single()));
}

export async function deleteLider(id) {
  ok(await admin.from("lider").delete().eq("id", id));
}

/* ------------------------- Cabos ------------------------- */
export async function createCabo(dados) {
  const registro = {
    municipio_codigo: dados.municipio_codigo,
    lider_id: dados.lider_id || null,
    nome: texto(dados.nome),
    contato: dados.contato ?? "",
    endereco: dados.endereco ?? "",
    lat: dados.lat ?? null,
    lng: dados.lng ?? null,
  };
  return ok(await admin.from("cabo").insert(registro).select("*").single());
}

export async function updateCabo(dados) {
  const alteracoes = patch(dados, [
    "nome", "contato", "endereco", "lat", "lng", "municipio_codigo",
  ]);
  if (dados.lider_id !== undefined) alteracoes.lider_id = dados.lider_id || null;
  if (alteracoes.nome !== undefined) alteracoes.nome = texto(alteracoes.nome);
  return ok(
    await admin.from("cabo").update(alteracoes).eq("id", dados.id).select("*").single()
  );
}

export async function deleteCabo(id) {
  ok(await admin.from("cabo").delete().eq("id", id));
}

/* ------------------------- Rotas de rua ------------------------- */
export async function getRotas(municipio_codigo) {
  const rotas = ok(
    await admin.from("rota").select("*")
      .eq("municipio_codigo", municipio_codigo)
      .order("id", { ascending: false })
  );
  if (!rotas.length) return [];

  const pontos = ok(
    await admin.from("rota_ponto").select("*, cabo(nome)")
      .in("rota_id", rotas.map((rota) => rota.id))
      .order("ordem").order("id")
  );
  const porRota = new Map(rotas.map((rota) => [rota.id, []]));
  for (const ponto of pontos) {
    const { cabo, ...resto } = ponto;
    porRota.get(ponto.rota_id)?.push({ ...resto, cabo_nome: cabo?.nome ?? null });
  }
  return rotas.map((rota) => ({ ...rota, pontos: porRota.get(rota.id) || [] }));
}

export async function createRota({ municipio_codigo, nome }) {
  const rota = ok(
    await admin.from("rota")
      .insert({ municipio_codigo, nome: texto(nome) })
      .select("*").single()
  );
  return { ...rota, pontos: [] };
}

export async function updateRota(dados) {
  const alteracoes = patch(dados, [
    "nome", "status", "geometria", "distancia_m", "duracao_s",
  ]);
  return ok(
    await admin.from("rota").update(alteracoes).eq("id", dados.id).select("*").single()
  );
}

export async function deleteRota(id) {
  ok(await admin.from("rota").delete().eq("id", id));
}

export async function createRotaPonto({ rota_id, cabo_id = null, label = "", lat, lng }) {
  const ultimo = ok(
    await admin.from("rota_ponto").select("ordem")
      .eq("rota_id", rota_id).order("ordem", { ascending: false }).limit(1).maybeSingle()
  );
  const ordem = (ultimo?.ordem ?? -1) + 1;
  return ok(
    await admin.from("rota_ponto")
      .insert({ rota_id, cabo_id: cabo_id || null, label, lat, lng, ordem })
      .select("*").single()
  );
}

export async function updateRotaPonto(dados) {
  const alteracoes = patch(dados, ["label", "ordem"]);
  return ok(
    await admin.from("rota_ponto").update(alteracoes).eq("id", dados.id).select("*").single()
  );
}

export async function deleteRotaPonto(id) {
  ok(await admin.from("rota_ponto").delete().eq("id", id));
}

/* ------------------------- Operação de campo ------------------------- */
function statusDaTarefa(tarefa) {
  if (tarefa.status === "cancelada") return "cancelada";
  const total = tarefa.cabos.length;
  const registrados = tarefa.cabos.filter((cabo) => ["retorno", "ausente"].includes(cabo.status)).length;
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  if (total && registrados === total) return "conferida";
  if (registrados) return "parcial";
  if (tarefa.data < hoje) return "atrasada";
  return "planejada";
}

// Achata os embeds do PostgREST no formato plano que a UI ja consumia.
function achatarTarefa(tarefa) {
  const { rota, lider, ...resto } = tarefa;
  return {
    ...resto,
    rota_nome: rota?.nome ?? null,
    municipio_codigo: rota?.municipio_codigo ?? null,
    municipio_nome: rota?.municipio?.nome ?? null,
    lider_nome: lider?.nome ?? null,
    lider_contato: lider?.contato ?? null,
  };
}

// Busca cabos e pontos de varias tarefas de uma vez, para nao disparar uma
// consulta por tarefa como o SQLite fazia.
async function montarTarefas(tarefas) {
  if (!tarefas.length) return [];
  const planas = tarefas.map(achatarTarefa);

  const [vinculos, pontos] = await Promise.all([
    admin.from("tarefa_rota_cabo").select("*, cabo(nome, contato, lider_id)")
      .in("tarefa_id", planas.map((tarefa) => tarefa.id)).then(ok),
    admin.from("rota_ponto").select("*")
      .in("rota_id", [...new Set(planas.map((tarefa) => tarefa.rota_id))])
      .order("ordem").order("id").then(ok),
  ]);

  const cabosPorTarefa = new Map(planas.map((tarefa) => [tarefa.id, []]));
  for (const vinculo of vinculos) {
    const { cabo, ...resto } = vinculo;
    cabosPorTarefa.get(vinculo.tarefa_id)?.push({
      ...resto,
      nome: cabo?.nome ?? "",
      contato: cabo?.contato ?? "",
      cabo_lider_id: cabo?.lider_id ?? null,
    });
  }
  const pontosPorRota = new Map();
  for (const ponto of pontos) {
    if (!pontosPorRota.has(ponto.rota_id)) pontosPorRota.set(ponto.rota_id, []);
    pontosPorRota.get(ponto.rota_id).push(ponto);
  }

  return planas.map((tarefa) => {
    const cabos = (cabosPorTarefa.get(tarefa.id) || []).sort(porNome);
    const montada = { ...tarefa, cabos, pontos: pontosPorRota.get(tarefa.rota_id) || [] };
    montada.status_calculado = statusDaTarefa(montada);
    montada.retornos = cabos.filter((cabo) => cabo.status === "retorno").length;
    montada.ausentes = cabos.filter((cabo) => cabo.status === "ausente").length;
    montada.registrados = montada.retornos + montada.ausentes;
    return montada;
  });
}

export async function getTarefas(municipio_codigo) {
  const tarefas = ok(
    await admin.from("tarefa_rota")
      .select("*, rota!inner(nome, municipio_codigo), lider(nome, contato)")
      .eq("rota.municipio_codigo", municipio_codigo)
      .order("data", { ascending: false })
      .order("id", { ascending: false })
  );
  return montarTarefas(tarefas);
}

export async function getTarefaByToken(token) {
  const tarefa = ok(
    await admin.from("tarefa_rota")
      .select("*, rota!inner(nome, municipio_codigo, municipio(nome)), lider(nome, contato)")
      .eq("token", token).maybeSingle()
  );
  if (!tarefa) return null;
  const [montada] = await montarTarefas([tarefa]);
  return montada;
}

export async function createTarefa({ rota_id, lider_id, data, turno = "Manhã", observacao = "", cabo_ids = [] }) {
  const token = ok(
    await admin.rpc("criar_tarefa_rota", {
      p_rota_id: Number(rota_id),
      p_lider_id: Number(lider_id),
      p_data: data,
      p_turno: turno,
      p_observacao: observacao,
      p_cabo_ids: [...new Set(cabo_ids.map(Number))],
    })
  );
  return getTarefaByToken(token);
}

export async function updateTarefaCabo({ tarefa_id, cabo_id, status, observacao }) {
  const permitidos = new Set(["pendente", "retorno", "ausente"]);
  if (!permitidos.has(status)) throw new Error("Status inválido");

  const tarefa = ok(
    await admin.from("tarefa_rota").select("id, token").eq("id", tarefa_id).maybeSingle()
  );
  if (!tarefa) throw new Error("Plano de campo não encontrado");

  const alteracoes = {
    status,
    iniciado_em: null,
    concluido_em: status === "retorno" ? new Date().toISOString() : null,
  };
  if (observacao !== undefined && observacao !== null) alteracoes.observacao = observacao;

  const atualizados = ok(
    await admin.from("tarefa_rota_cabo").update(alteracoes)
      .eq("tarefa_id", tarefa.id).eq("cabo_id", cabo_id).select("cabo_id")
  );
  if (!atualizados.length) throw new Error("Cabo não pertence a este plano");

  return getTarefaByToken(tarefa.token);
}

export async function deleteTarefa(id) {
  ok(await admin.from("tarefa_rota").delete().eq("id", id));
}

/* ------------------------- Equipe ------------------------- */
export async function getEquipe() {
  const [lideres, cabos] = await Promise.all([
    admin.from("lider").select(`${COM_TAGS}, municipio(nome)`).then(ok),
    admin.from("cabo").select("*, municipio(nome), lider(nome)").then(ok),
  ]);

  return {
    lideres: lideres
      .map(({ municipio, ...lider }) => ({
        ...ordenarTags(lider),
        escopo_global: ehGlobal(lider.nivel) ? 1 : 0,
        municipio_nome: ehGlobal(lider.nivel) ? "Toda a campanha" : (municipio?.nome ?? ""),
      }))
      .sort((a, b) => colacao.compare(a.municipio_nome, b.municipio_nome) || porNome(a, b)),
    cabos: cabos
      .map(({ municipio, lider, ...cabo }) => ({
        ...cabo,
        municipio_nome: municipio?.nome ?? "",
        lider_nome: lider?.nome ?? null,
      }))
      .sort((a, b) => colacao.compare(a.municipio_nome, b.municipio_nome) || porNome(a, b)),
  };
}

/* ------------------------- Dashboard ------------------------- */
export async function getDashboard() {
  const [estado, estrategias, classificacoes] = await Promise.all([
    getEstado(),
    admin.from("estrategia").select("*", { count: "exact", head: true })
      .then(({ count, error }) => { if (error) throw new Error(error.message); return count ?? 0; }),
    admin.from("lider").select("classificacao").not("nivel", "in", `(${NIVEIS_GLOBAIS.join(",")})`).then(ok),
  ]);

  const comEquipe = estado.filter((municipio) => municipio.total > 0);
  const cores = { verde: 0, amarelo: 0, vermelho: 0, sem: 0 };
  for (const { classificacao } of classificacoes) {
    cores[classificacao && cores[classificacao] !== undefined ? classificacao : "sem"] += 1;
  }

  return {
    nMunicipios: estado.length,
    nCidadesComEquipe: comEquipe.length,
    nLideres: estado.reduce((soma, municipio) => soma + municipio.nLideres, 0),
    nCabos: estado.reduce((soma, municipio) => soma + municipio.nCabos, 0),
    nEstrategias: estrategias,
    sudoesteTotal: estado.filter((municipio) => municipio.sudoeste).length,
    sudoesteComEquipe: estado.filter((municipio) => municipio.sudoeste && municipio.total > 0).length,
    ranking: comEquipe.slice().sort((a, b) => (b.total - a.total) || (b.nLideres - a.nLideres)),
    cores,
  };
}

/* ------------------------- Orçamento da campanha ------------------------- */
function budgetNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

async function contar(tabela, aplicarFiltro = (query) => query) {
  const { count, error } = await aplicarFiltro(
    admin.from(tabela).select("*", { count: "exact", head: true })
  );
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function getBudgetCounters() {
  const globais = `(${NIVEIS_GLOBAIS.join(",")})`;
  const [cabos, liderancas, coordenadores] = await Promise.all([
    contar("cabo"),
    contar("lider", (query) => query.not("nivel", "in", globais)),
    contar("lider", (query) => query.in("nivel", NIVEIS_GLOBAIS)),
  ]);
  return { cabos, liderancas, coordenadores, equipe: cabos + liderancas + coordenadores };
}

export async function getOrcamento() {
  const [config, contadores, brutos] = await Promise.all([
    admin.from("orcamento_config").select("*").eq("id", 1).single().then(ok),
    getBudgetCounters(),
    admin.from("orcamento_item").select("*").order("ordem").order("id").then(ok),
  ]);

  const items = brutos.map((item) => {
    const usa_cadastro = item.vinculo !== "manual" && item.modo_quantidade !== "simulacao";
    const quantidade_calculada = usa_cadastro ? Number(contadores[item.vinculo] || 0) : Number(item.quantidade);
    return { ...item, usa_cadastro, quantidade_calculada, total: quantidade_calculada * Number(item.periodos) * Number(item.custo_unitario) };
  });

  const categoriasMap = new Map();
  for (const item of items) categoriasMap.set(item.categoria, (categoriasMap.get(item.categoria) || 0) + item.total);
  const categorias = [...categoriasMap.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total);

  const planejado = items.reduce((soma, item) => soma + item.total, 0);
  const reserva = Number(config.fundo_total) * Number(config.reserva_percentual) / 100;

  return {
    config,
    contadores,
    items,
    categorias,
    resumo: {
      planejado,
      reserva,
      saldo: Number(config.fundo_total) - planejado - reserva,
      percentual_comprometido: Number(config.fundo_total) > 0 ? (planejado / Number(config.fundo_total)) * 100 : 0,
    },
  };
}

export async function updateOrcamentoConfig({ nome_cenario, fundo_total, reserva_percentual }) {
  const alteracoes = { atualizado_em: new Date().toISOString() };
  if (nome_cenario?.trim()) alteracoes.nome_cenario = nome_cenario.trim();
  if (fundo_total !== undefined) alteracoes.fundo_total = budgetNumber(fundo_total);
  if (reserva_percentual !== undefined) alteracoes.reserva_percentual = Math.min(100, budgetNumber(reserva_percentual));

  ok(await admin.from("orcamento_config").update(alteracoes).eq("id", 1));
  return getOrcamento();
}

export async function createOrcamentoItem({ categoria = "Outros", nome, vinculo = "manual", modo_quantidade = "simulacao", quantidade = 1, periodos = 1, custo_unitario = 0, observacao = "" }) {
  if (!texto(nome)) throw new Error("Informe o nome do custo");
  const permitidos = new Set(["manual", "cabos", "liderancas", "coordenadores", "equipe"]);
  const vinculoEscolhido = permitidos.has(vinculo) ? vinculo : "manual";
  const modoEscolhido = vinculoEscolhido === "manual"
    ? "simulacao"
    : (modo_quantidade === "simulacao" ? "simulacao" : "automatico");

  const ultimo = ok(
    await admin.from("orcamento_item").select("ordem")
      .order("ordem", { ascending: false }).limit(1).maybeSingle()
  );

  const criado = ok(
    await admin.from("orcamento_item").insert({
      categoria: texto(categoria) || "Outros",
      nome: texto(nome),
      vinculo: vinculoEscolhido,
      modo_quantidade: modoEscolhido,
      quantidade: budgetNumber(quantidade, 1),
      periodos: budgetNumber(periodos, 1),
      custo_unitario: budgetNumber(custo_unitario),
      observacao: texto(observacao),
      ordem: (ultimo?.ordem ?? -1) + 1,
    }).select("id").single()
  );

  const { items } = await getOrcamento();
  return items.find((item) => item.id === criado.id);
}

export async function updateOrcamentoItem(dados) {
  const permitidos = new Set(["manual", "cabos", "liderancas", "coordenadores", "equipe"]);
  const atual = ok(
    await admin.from("orcamento_item").select("vinculo, modo_quantidade").eq("id", dados.id).maybeSingle()
  );
  if (!atual) throw new Error("Custo não encontrado");

  const vinculo = dados.vinculo === undefined
    ? atual.vinculo
    : (permitidos.has(dados.vinculo) ? dados.vinculo : "manual");
  const modo_quantidade = vinculo === "manual"
    ? "simulacao"
    : (dados.modo_quantidade === undefined
        ? atual.modo_quantidade
        : (dados.modo_quantidade === "simulacao" ? "simulacao" : "automatico"));

  const alteracoes = { vinculo, modo_quantidade };
  if (dados.categoria?.trim()) alteracoes.categoria = dados.categoria.trim();
  if (dados.nome?.trim()) alteracoes.nome = dados.nome.trim();
  if (dados.quantidade !== undefined) alteracoes.quantidade = budgetNumber(dados.quantidade);
  if (dados.periodos !== undefined) alteracoes.periodos = budgetNumber(dados.periodos);
  if (dados.custo_unitario !== undefined) alteracoes.custo_unitario = budgetNumber(dados.custo_unitario);
  if (dados.observacao !== undefined) alteracoes.observacao = texto(dados.observacao);

  ok(await admin.from("orcamento_item").update(alteracoes).eq("id", dados.id));
  const { items } = await getOrcamento();
  return items.find((item) => item.id === Number(dados.id));
}

export async function deleteOrcamentoItem(id) {
  ok(await admin.from("orcamento_item").delete().eq("id", id));
}

/* ------------------------- Estratégias ------------------------- */
export async function getEstrategias() {
  return ok(await admin.from("estrategia").select("*").order("id", { ascending: false }));
}

export async function createEstrategia({ titulo = "", texto: corpo = "", categoria = "Geral" }) {
  return ok(
    await admin.from("estrategia").insert({ titulo, texto: corpo, categoria }).select("*").single()
  );
}

export async function updateEstrategia(dados) {
  const alteracoes = patch(dados, ["titulo", "texto", "categoria"]);
  return ok(
    await admin.from("estrategia").update(alteracoes).eq("id", dados.id).select("*").single()
  );
}

export async function deleteEstrategia(id) {
  ok(await admin.from("estrategia").delete().eq("id", id));
}

export async function importEstrategias(itens) {
  const linhas = (itens || []).filter(Boolean).map((item) => ({
    titulo: item.titulo || "",
    texto: item.descricao || item.texto || "",
    categoria: item.categoria || "Geral",
  }));
  if (!linhas.length) return { importados: 0 };
  ok(await admin.from("estrategia").insert(linhas));
  return { importados: linhas.length };
}

// Importa o backup do app HTML de contatos
// (data = [{nome, codigo, regiao, pessoas: [{nome, cargo, obs}]}]).
export async function importContatos(cidades) {
  const municipios = ok(await admin.from("municipio").select("codigo, nome"));
  const porCodigo = new Set(municipios.map((municipio) => municipio.codigo));
  const porNomeMunicipio = new Map(
    municipios.map((municipio) => [municipio.nome.toLocaleLowerCase("pt-BR"), municipio.codigo])
  );

  const existentes = ok(await admin.from("lider").select("municipio_codigo, nome"));
  const jaCadastrados = new Set(
    existentes.map((lider) => `${lider.municipio_codigo}|${lider.nome.toLocaleLowerCase("pt-BR")}`)
  );

  const novos = [];
  let municipiosAtingidos = 0, pulados = 0, extras = 0;

  for (const cidade of cidades || []) {
    let codigo = null;
    if (cidade.codigo && porCodigo.has(Number(cidade.codigo))) codigo = Number(cidade.codigo);
    else if (cidade.nome) codigo = porNomeMunicipio.get(String(cidade.nome).toLocaleLowerCase("pt-BR")) ?? null;

    const pessoas = (cidade.pessoas || []).filter((pessoa) => pessoa && texto(pessoa.nome));
    if (!codigo) { extras += pessoas.length; continue; }

    let adicionados = 0;
    for (const pessoa of pessoas) {
      const nome = texto(pessoa.nome);
      const chave = `${codigo}|${nome.toLocaleLowerCase("pt-BR")}`;
      if (jaCadastrados.has(chave)) { pulados++; continue; }
      jaCadastrados.add(chave);
      const anotacoes = [pessoa.cargo, pessoa.obs].map((item) => String(item || "").trim()).filter(Boolean);
      novos.push({ municipio_codigo: codigo, nome, observacao: anotacoes.join(" · ") });
      adicionados++;
    }
    if (adicionados) municipiosAtingidos++;
  }

  if (novos.length) ok(await admin.from("lider").insert(novos));
  return { importados: novos.length, municipios: municipiosAtingidos, pulados, extras };
}

export async function exportAll() {
  const [municipios, lideres, cabos, rotas, rota_pontos, tarefas, tarefa_cabos, estrategias, orcamento_config, orcamento_itens, tags] =
    await Promise.all([
      admin.from("municipio").select("*").order("nome").then(ok),
      admin.from("lider").select(COM_TAGS).order("id").then(ok),
      admin.from("cabo").select("*").order("id").then(ok),
      admin.from("rota").select("*").order("id").then(ok),
      admin.from("rota_ponto").select("*").order("rota_id").order("ordem").then(ok),
      admin.from("tarefa_rota").select("*").order("id").then(ok),
      admin.from("tarefa_rota_cabo").select("*").order("tarefa_id").then(ok),
      admin.from("estrategia").select("*").order("id").then(ok),
      admin.from("orcamento_config").select("*").eq("id", 1).single().then(ok),
      admin.from("orcamento_item").select("*").order("ordem").then(ok),
      admin.from("tag").select("*").order("ordem").then(ok),
    ]);

  return {
    exportado_em: new Date().toISOString(),
    municipios, lideres, cabos, rotas, rota_pontos, tarefas, tarefa_cabos,
    estrategias, orcamento_config, orcamento_itens, tags,
  };
}
