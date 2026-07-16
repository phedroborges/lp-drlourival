"use client";
import { useEffect, useMemo, useState } from "react";
import Modal from "@/app/ui/Modal";

const CATEGORIES = ["Cabos eleitorais", "Coordenação", "Equipe", "Impressos", "Marketing", "Mídia", "Eventos", "Transporte e logística", "Jurídico e contábil", "Infraestrutura", "Outros"];
const LINKS = {
  manual: "Quantidade manual",
  cabos: "Cabos cadastrados",
  liderancas: "Lideranças cadastradas",
  coordenadores: "Coordenadores cadastrados",
  equipe: "Toda a equipe cadastrada",
};
const TEMPLATES = [
  { categoria: "Cabos eleitorais", nome: "Remuneração dos cabos", vinculo: "cabos" },
  { categoria: "Marketing", nome: "Marketing digital", vinculo: "manual" },
  { categoria: "Impressos", nome: "Santinhos e materiais impressos", vinculo: "manual" },
  { categoria: "Coordenação", nome: "Equipe de coordenação", vinculo: "coordenadores" },
];
const CATEGORY_COLORS = ["#3857d6", "#7963d8", "#1aa67a", "#e29a35", "#e9655b", "#2d9db2", "#a865c1", "#6c7b8b"];

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function savedAt(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(`${value.replace(" ", "T")}Z`));
}

function blankItem(template = {}) {
  const item = { categoria: "Outros", nome: "", vinculo: "manual", modo_quantidade: "simulacao", quantidade: 1, periodos: 1, custo_unitario: 0, observacao: "", ...template };
  if (!template.modo_quantidade) item.modo_quantidade = item.vinculo === "manual" ? "simulacao" : "automatico";
  return item;
}

async function request(method, body) {
  const url = method === "GET" ? `/api/orcamento?at=${Date.now()}` : "/api/orcamento";
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Não foi possível salvar o orçamento");
  return result;
}

export default function OrcamentoPage() {
  const [data, setData] = useState(null);
  const [config, setConfig] = useState({ nome_cenario: "Cenário base", fundo_total: 0, reserva_percentual: 5 });
  const [itemForm, setItemForm] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const result = await request("GET");
      setData(result);
      setConfig(result.config);
    } catch (reason) { setError(reason.message); }
  }
  useEffect(() => { load(); }, []);

  const usesRegistry = Boolean(itemForm && itemForm.vinculo !== "manual" && itemForm.modo_quantidade !== "simulacao");
  const quantity = itemForm ? (usesRegistry ? Number(data?.contadores?.[itemForm.vinculo] || 0) : Number(itemForm.quantidade || 0)) : 0;
  const itemPreview = quantity * Number(itemForm?.periodos || 0) * Number(itemForm?.custo_unitario || 0);
  const usePercent = data?.config?.fundo_total ? Math.min(100, ((data.resumo.planejado + data.resumo.reserva) / data.config.fundo_total) * 100) : 0;
  const maxCategory = useMemo(() => Math.max(1, ...(data?.categorias || []).map((item) => item.total)), [data]);

  async function saveConfig(event) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      const result = await request("PUT", config);
      setData(result); setConfig(result.config); setNotice("Cenário financeiro atualizado.");
    } catch (reason) { setError(reason.message); }
    finally { setSaving(false); }
  }

  async function saveItem(event) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      const editing = Boolean(itemForm.id);
      await request(itemForm.id ? "PATCH" : "POST", itemForm);
      setItemForm(null); await load(); setNotice(editing ? "Custo atualizado e salvo no sistema." : "Custo incluído e salvo no sistema.");
    } catch (reason) { setError(reason.message); }
    finally { setSaving(false); }
  }

  async function deleteItem(item) {
    if (!confirm(`Excluir “${item.nome}” do orçamento?`)) return;
    try { await request("DELETE", { id: item.id }); await load(); }
    catch (reason) { setError(reason.message); }
  }

  if (!data) return <main className="command-page budget-page"><div className="loading-card">Preparando o orçamento…</div></main>;

  return (
    <main className="command-page budget-page">
      <header className="dashboard-heading budget-heading">
        <div><span className="eyebrow">Planejamento financeiro</span><h1>Orçamento da campanha</h1><p>Descubra quanto a operação custa antes de comprometer o fundo disponível.</p></div>
        <button className="primary-button" onClick={() => setItemForm(blankItem())}>+ Adicionar custo</button>
      </header>

      {error ? <div className="error-banner">{error}<button onClick={() => setError("")}>×</button></div> : null}
      {notice ? <div className="budget-notice">{notice}<button onClick={() => setNotice("")}>×</button></div> : null}

      <form className="budget-fund-card" onSubmit={saveConfig}>
        <div className="budget-fund-copy"><span className="budget-icon">R$</span><div><strong>Defina o dinheiro disponível</strong><p>O saldo será recalculado sempre que um custo ou pessoa for alterado.</p></div></div>
        <label><span>Nome do cenário</span><input value={config.nome_cenario} onChange={(event) => setConfig({ ...config, nome_cenario: event.target.value })} /></label>
        <label><span>Fundo previsto</span><input type="number" min="0" step="1000" value={config.fundo_total} onChange={(event) => setConfig({ ...config, fundo_total: event.target.value })} /></label>
        <label><span>Reserva de segurança</span><div className="budget-suffix"><input type="number" min="0" max="100" step="1" value={config.reserva_percentual} onChange={(event) => setConfig({ ...config, reserva_percentual: event.target.value })} /><i>%</i></div></label>
        <button className="primary-button" disabled={saving}>{saving ? "Salvando…" : "Salvar cenário"}</button>
      </form>
      <p className="budget-save-state"><span>✓</span> Dados salvos no sistema{data.config.atualizado_em ? ` · última atualização em ${savedAt(data.config.atualizado_em)}` : ""}</p>

      <section className="budget-kpis">
        <article><span className="budget-kpi-icon blue">$</span><div><small>Fundo previsto</small><strong>{money.format(data.config.fundo_total)}</strong><p>{data.config.nome_cenario}</p></div></article>
        <article><span className="budget-kpi-icon violet">≡</span><div><small>Custos planejados</small><strong>{money.format(data.resumo.planejado)}</strong><p>{data.items.length} itens no orçamento</p></div></article>
        <article><span className="budget-kpi-icon yellow">◇</span><div><small>Reserva protegida</small><strong>{money.format(data.resumo.reserva)}</strong><p>{percent.format(data.config.reserva_percentual)}% do fundo</p></div></article>
        <article className={data.resumo.saldo < 0 ? "danger" : "success"}><span className="budget-kpi-icon">{data.resumo.saldo < 0 ? "!" : "✓"}</span><div><small>{data.resumo.saldo < 0 ? "Orçamento excedido" : "Saldo livre"}</small><strong>{money.format(data.resumo.saldo)}</strong><p>{data.resumo.saldo < 0 ? "Reduza custos ou amplie o fundo" : "Disponível para novas decisões"}</p></div></article>
      </section>

      <section className="budget-health-card">
        <div><span>Uso do fundo</span><strong>{percent.format(data.resumo.percentual_comprometido)}% comprometido em custos</strong></div>
        <div className="budget-health-track"><span style={{ width: `${usePercent}%` }} className={data.resumo.saldo < 0 ? "over" : ""} /></div>
        <div className="budget-health-legend"><span><i className="planned" /> Custos {money.format(data.resumo.planejado)}</span><span><i className="reserved" /> Reserva {money.format(data.resumo.reserva)}</span><span><i className="free" /> Saldo {money.format(Math.max(0, data.resumo.saldo))}</span></div>
      </section>

      <div className="budget-main-grid">
        <section className="budget-panel">
          <div className="budget-panel-head"><div><span className="eyebrow">Distribuição</span><h2>Onde o dinheiro está indo</h2></div><small>Por categoria</small></div>
          {data.categorias.length ? <div className="budget-category-list">{data.categorias.map((item, index) => <div key={item.categoria}><div><span><i style={{ "--budget-color": CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />{item.categoria}</span><strong>{money.format(item.total)}</strong></div><div className="budget-category-track"><span style={{ width: `${(item.total / maxCategory) * 100}%`, "--budget-color": CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} /></div><small>{data.config.fundo_total ? `${percent.format((item.total / data.config.fundo_total) * 100)}% do fundo` : "Defina o fundo para ver o percentual"}</small></div>)}</div> : <div className="budget-empty"><span>◎</span><h3>A distribuição aparecerá aqui</h3><p>Adicione os primeiros custos para comparar as áreas da campanha.</p></div>}
        </section>

        <section className="budget-panel budget-team-panel">
          <div className="budget-panel-head"><div><span className="eyebrow">Base automática</span><h2>Equipe cadastrada</h2></div><small>Atualização dinâmica</small></div>
          <div className="budget-team-counts"><div><strong>{data.contadores.cabos}</strong><span>Cabos</span></div><div><strong>{data.contadores.liderancas}</strong><span>Lideranças</span></div><div><strong>{data.contadores.coordenadores}</strong><span>Coordenação</span></div></div>
          <p>Você pode usar os números cadastrados ou criar uma simulação sem alterar a equipe real.</p>
          <div className="budget-team-actions"><button className="secondary-button" onClick={() => setItemForm(blankItem(TEMPLATES[0]))}>Usar cabos cadastrados</button><button className="secondary-button simulation" onClick={() => setItemForm(blankItem({ ...TEMPLATES[0], modo_quantidade: "simulacao", quantidade: Math.max(1, data.contadores.cabos) }))}>Simular quantidade</button></div>
        </section>
      </div>

      <section className="budget-costs-card">
        <div className="budget-costs-head"><div><span className="eyebrow">Calculadora orçamentária</span><h2>Custos planejados</h2><p>Cada linha calcula quantidade × valor × meses ou parcelas.</p></div><button className="primary-button" onClick={() => setItemForm(blankItem())}>+ Novo custo</button></div>
        <div className="budget-template-row"><span>Adicionar rápido:</span>{TEMPLATES.map((template) => <button key={template.nome} onClick={() => setItemForm(blankItem(template))}>{template.nome}</button>)}</div>
        {data.items.length ? <div className="budget-cost-list">{data.items.map((item) => <article key={item.id}>
          <span className="budget-item-symbol">{item.categoria.slice(0, 2).toUpperCase()}</span>
          <div className="budget-item-name"><span>{item.categoria}</span><strong>{item.nome}</strong>{item.observacao ? <small>{item.observacao}</small> : null}</div>
          <div className="budget-item-formula"><span>{item.quantidade_calculada} × {money.format(item.custo_unitario)}{item.periodos !== 1 ? ` × ${item.periodos} períodos` : ""}</span><small>{item.vinculo === "manual" ? "Quantidade informada" : item.modo_quantidade === "simulacao" ? `Simulação de ${LINKS[item.vinculo].toLowerCase()}` : LINKS[item.vinculo]}</small></div>
          <strong className="budget-item-total">{money.format(item.total)}</strong>
          <div className="budget-item-actions"><button onClick={() => setItemForm({ ...item })}>Editar</button><button className="danger-link" onClick={() => deleteItem(item)}>Excluir</button></div>
        </article>)}</div> : <div className="budget-empty wide"><span>＋</span><h3>Comece pelo maior custo</h3><p>Por exemplo: vincule “Remuneração dos cabos” aos cabos cadastrados e informe o valor por pessoa.</p><button className="primary-button" onClick={() => setItemForm(blankItem(TEMPLATES[0]))}>Adicionar custo dos cabos</button></div>}
      </section>

      <p className="budget-disclaimer">Ferramenta interna de simulação e decisão. A prestação de contas oficial deve ser acompanhada pela contabilidade e assessoria jurídica da campanha.</p>

      {itemForm ? <Modal title={itemForm.id ? "Editar custo" : "Adicionar custo"} eyebrow="Calculadora orçamentária" onClose={() => setItemForm(null)}>
        <form className="budget-item-form" onSubmit={saveItem}>
          <label><span>Nome do custo</span><input autoFocus required value={itemForm.nome} placeholder="Ex.: Remuneração dos cabos" onChange={(event) => setItemForm({ ...itemForm, nome: event.target.value })} /></label>
          <label><span>Categoria</span><input list="budget-categories" required value={itemForm.categoria} onChange={(event) => setItemForm({ ...itemForm, categoria: event.target.value })} /><datalist id="budget-categories">{CATEGORIES.map((category) => <option key={category} value={category} />)}</datalist></label>
          <label className="full"><span>O que esta quantidade representa?</span><select value={itemForm.vinculo} onChange={(event) => { const vinculo = event.target.value; setItemForm({ ...itemForm, vinculo, modo_quantidade: vinculo === "manual" ? "simulacao" : "automatico" }); }}>{Object.entries(LINKS).map(([value, label]) => <option key={value} value={value}>{label}{value !== "manual" ? ` (${data.contadores[value]})` : ""}</option>)}</select></label>
          {itemForm.vinculo !== "manual" ? <div className="budget-quantity-mode full" role="group" aria-label="Modo da quantidade"><button type="button" className={usesRegistry ? "active" : ""} onClick={() => setItemForm({ ...itemForm, modo_quantidade: "automatico" })}><strong>Usar cadastro atual</strong><small>{data.contadores[itemForm.vinculo]} pessoas agora · atualiza sozinho</small></button><button type="button" className={!usesRegistry ? "active simulation" : ""} onClick={() => setItemForm({ ...itemForm, modo_quantidade: "simulacao", quantidade: Number(itemForm.quantidade || data.contadores[itemForm.vinculo] || 1) })}><strong>Simular outra quantidade</strong><small>Teste um cenário sem cadastrar pessoas</small></button></div> : null}
          <label><span>{usesRegistry ? "Quantidade cadastrada" : itemForm.vinculo === "manual" ? "Quantidade" : "Quantidade simulada"}</span><input type="number" min="0" step="1" disabled={usesRegistry} value={usesRegistry ? quantity : itemForm.quantidade} onChange={(event) => setItemForm({ ...itemForm, quantidade: event.target.value })} /><small className="budget-field-help">{usesRegistry ? "Puxada automaticamente do sistema." : itemForm.vinculo === "manual" ? "Informe quantas unidades entram no cálculo." : "Não altera o cadastro real de pessoas."}</small></label>
          <label><span>Meses ou parcelas</span><input type="number" min="0" step="1" value={itemForm.periodos} onChange={(event) => setItemForm({ ...itemForm, periodos: event.target.value })} /></label>
          <label className="full"><span>Valor por unidade</span><input type="number" min="0" step="0.01" value={itemForm.custo_unitario} onChange={(event) => setItemForm({ ...itemForm, custo_unitario: event.target.value })} /></label>
          <label className="full"><span>Observação</span><textarea rows="3" value={itemForm.observacao} placeholder="Detalhes, fornecedor ou premissas deste cálculo" onChange={(event) => setItemForm({ ...itemForm, observacao: event.target.value })} /></label>
          <div className="budget-form-total full"><span>Total calculado</span><strong>{money.format(itemPreview)}</strong><small>{quantity} × {money.format(Number(itemForm.custo_unitario || 0))} × {Number(itemForm.periodos || 0)}</small></div>
          <div className="modal-actions full"><button type="button" className="secondary-button" onClick={() => setItemForm(null)}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? "Salvando…" : "Salvar no orçamento"}</button></div>
        </form>
      </Modal> : null}
    </main>
  );
}
