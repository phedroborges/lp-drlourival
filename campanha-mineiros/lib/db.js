// Banco de dados local SQLite (driver nativo do Node 24: node:sqlite).
// Roda SOMENTE no servidor.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { MUNICIPIOS, MINEIROS_CODIGO } from "./municipiosSeed.js";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "campanha.db");

// Bairros/setores de Mineiros, agrupados.
const BAIRROS_MINEIROS = [
  ["Setores e Bairros Tradicionais", [
    "Centro", "Aeroporto", "Cidade Nova", "Cruvinel", "Jardim Goiás II", "Machado",
    "Marcelino Teodoro Gomes", "Martins", "Mundinho", "Nossa Senhora Aparecida",
    "Nossa Senhora de Fátima", "Oeste", "Pecuária", "São Bento",
  ]],
  ["Residenciais e Loteamentos", [
    "31 de Outubro", "Buena Vista", "Bairro Popular", "Divino Espírito Santo", "Cambauva",
    "Jardim dos Ipês", "Martins II", "Residencial Araguaia", "Santa Isabel", "Mineirinho",
    "Morada do Sol", "Parque dos Jatobás", "Portal das Emas", "Alvina Paniago", "Dona Letice",
    "Jardim das Paineiras", "Jardim Floresta", "Parque Flamboyant", "Santa Maria",
    "Versailles", "Vila Manoel Abrão",
  ]],
  ["Distritos", [
    "DAIM (Distrito Agro Industrial de Mineiros)",
  ]],
];

// Lideranças da reunião, pré-cadastradas em Mineiros (classificação = cor).
const LIDERES_SEED = [
  ["Kenedi", "Liderança política", "amarelo", ""],
  ["Joselman", "Liderança política", "amarelo", "Em transição (amarelo → verde)"],
  ["Derges", "Liderança política", "vermelho", ""],
  ["Marta Brandão", "Liderança política", "verde", "Convidar para reunião"],
  ["Maranhão", "Liderança política", "verde", "Convidar para reunião"],
  ["Wglevison do agro", "Liderança do agro", "verde", "Convidar para reunião"],
  ["Simone", "Liderança política", "verde", "Convidar para reunião"],
  ["Welma", "Liderança política", "amarelo", "Convidar para reunião"],
  ["Gilberto", "Liderança política", "", "Classificação a definir"],
  ["Valdemar do IML", "Liderança política", "", "Classificação a definir"],
  ["Major Souza", "Liderança política", "amarelo", ""],
  ["Samuel Borracheiro", "Liderança política", "vermelho", ""],
];

function init() {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  // O build do Next avalia rotas em paralelo. Aguarde um eventual lock curto
  // enquanto outro worker termina a inicializacao/migracao do mesmo arquivo.
  db.exec("PRAGMA busy_timeout = 10000;");
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS municipio (
      codigo   INTEGER PRIMARY KEY,
      nome     TEXT NOT NULL,
      sudoeste INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS bairro (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      municipio_codigo INTEGER NOT NULL,
      nome             TEXT NOT NULL,
      grupo            TEXT NOT NULL DEFAULT 'Bairros',
      ordem            INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (municipio_codigo) REFERENCES municipio(codigo) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS lider (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      municipio_codigo INTEGER NOT NULL,
      nome             TEXT NOT NULL,
      cargo            TEXT NOT NULL DEFAULT '',
      contato          TEXT NOT NULL DEFAULT '',
      classificacao    TEXT NOT NULL DEFAULT '',
      observacao       TEXT NOT NULL DEFAULT '',
      criado_em        TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (municipio_codigo) REFERENCES municipio(codigo) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS lider_bairro (
      lider_id  INTEGER NOT NULL,
      bairro_id INTEGER NOT NULL,
      PRIMARY KEY (lider_id, bairro_id),
      FOREIGN KEY (lider_id)  REFERENCES lider(id)  ON DELETE CASCADE,
      FOREIGN KEY (bairro_id) REFERENCES bairro(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS cabo (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      bairro_id INTEGER NOT NULL,
      lider_id  INTEGER,
      nome      TEXT NOT NULL,
      contato   TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (bairro_id) REFERENCES bairro(id) ON DELETE CASCADE,
      FOREIGN KEY (lider_id)  REFERENCES lider(id)  ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS estrategia (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo     TEXT NOT NULL DEFAULT '',
      texto      TEXT NOT NULL DEFAULT '',
      categoria  TEXT NOT NULL DEFAULT 'Geral',
      criado_em  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Semear os 246 municípios (idempotente).
  const insMun = db.prepare("INSERT OR IGNORE INTO municipio (codigo, nome, sudoeste) VALUES (?, ?, ?)");
  for (const m of MUNICIPIOS) insMun.run(m.codigo, m.nome, m.sudoeste);

  // Semear bairros de Mineiros (idempotente por nome dentro do município).
  if (MINEIROS_CODIGO) {
    const existe = db.prepare("SELECT COUNT(*) n FROM bairro WHERE municipio_codigo = ?").get(MINEIROS_CODIGO).n;
    if (existe === 0) {
      const insB = db.prepare("INSERT INTO bairro (municipio_codigo, nome, grupo, ordem) VALUES (?, ?, ?, ?)");
      let ordem = 0;
      for (const [grupo, nomes] of BAIRROS_MINEIROS) for (const nome of nomes) insB.run(MINEIROS_CODIGO, nome, grupo, ordem++);
    }
    // Semear lideranças da reunião (uma vez).
    const nLid = db.prepare("SELECT COUNT(*) n FROM lider").get().n;
    if (nLid === 0) {
      const insL = db.prepare("INSERT INTO lider (municipio_codigo, nome, cargo, classificacao, observacao) VALUES (?, ?, ?, ?, ?)");
      for (const [nome, cargo, cor, obs] of LIDERES_SEED) insL.run(MINEIROS_CODIGO, nome, cargo, cor, obs);
    }
  }

  return db;
}

const globalRef = globalThis;
export const db = globalRef.__campanhaDb ?? (globalRef.__campanhaDb = init());

function tierOf(total) { return total === 0 ? 0 : total === 1 ? 1 : total <= 3 ? 2 : 3; }

/* ------------------------- Estado (mapa) ------------------------- */
export function getEstado() {
  const rows = db.prepare(`
    SELECT m.codigo, m.nome, m.sudoeste,
      (SELECT COUNT(*) FROM lider l WHERE l.municipio_codigo = m.codigo) AS nLideres,
      (SELECT COUNT(*) FROM cabo c JOIN bairro b ON b.id = c.bairro_id WHERE b.municipio_codigo = m.codigo) AS nCabos,
      (SELECT COUNT(*) FROM bairro b WHERE b.municipio_codigo = m.codigo) AS nBairros
    FROM municipio m ORDER BY m.nome COLLATE NOCASE
  `).all();
  return rows.map((r) => ({ ...r, total: r.nLideres + r.nCabos, tier: tierOf(r.nLideres + r.nCabos) }));
}

/* ------------------------- Cidade ------------------------- */
export function getMunicipio(codigo) {
  const m = db.prepare("SELECT * FROM municipio WHERE codigo = ?").get(codigo);
  if (!m) return null;
  const lideres = db.prepare("SELECT * FROM lider WHERE municipio_codigo = ? ORDER BY nome COLLATE NOCASE").all(codigo);
  const bairros = db.prepare("SELECT * FROM bairro WHERE municipio_codigo = ? ORDER BY ordem, nome").all(codigo);
  const bid = new Map(bairros.map((b) => [b.id, { ...b, lideres: [], cabos: [] }]));
  if (bairros.length) {
    const ph = bairros.map(() => "?").join(",");
    const ids = bairros.map((b) => b.id);
    for (const row of db.prepare(
      `SELECT lb.bairro_id, l.id, l.nome, l.cargo, l.contato, l.classificacao
         FROM lider_bairro lb JOIN lider l ON l.id = lb.lider_id
        WHERE lb.bairro_id IN (${ph}) ORDER BY l.nome COLLATE NOCASE`
    ).all(...ids)) {
      bid.get(row.bairro_id)?.lideres.push({ id: row.id, nome: row.nome, cargo: row.cargo, contato: row.contato, classificacao: row.classificacao });
    }
    for (const c of db.prepare(`SELECT * FROM cabo WHERE bairro_id IN (${ph}) ORDER BY id`).all(...ids)) {
      bid.get(c.bairro_id)?.cabos.push(c);
    }
  }
  // Agrupar bairros preservando ordem dos grupos.
  const grupos = [];
  for (const b of bid.values()) {
    let g = grupos.find((x) => x.grupo === b.grupo);
    if (!g) { g = { grupo: b.grupo, bairros: [] }; grupos.push(g); }
    g.bairros.push(b);
  }
  return { ...m, lideres, grupos };
}

/* ------------------------- Lideranças ------------------------- */
export function createLider({ municipio_codigo, nome, cargo = "", contato = "", classificacao = "", observacao = "" }) {
  const r = db.prepare(
    "INSERT INTO lider (municipio_codigo, nome, cargo, contato, classificacao, observacao) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(municipio_codigo, String(nome).trim(), cargo, contato, classificacao, observacao);
  return db.prepare("SELECT * FROM lider WHERE id = ?").get(r.lastInsertRowid);
}
export function updateLider({ id, nome, cargo, contato, classificacao, observacao }) {
  db.prepare(
    `UPDATE lider SET nome=COALESCE(?,nome), cargo=COALESCE(?,cargo), contato=COALESCE(?,contato),
       classificacao=COALESCE(?,classificacao), observacao=COALESCE(?,observacao) WHERE id=?`
  ).run(nome ?? null, cargo ?? null, contato ?? null, classificacao ?? null, observacao ?? null, id);
  return db.prepare("SELECT * FROM lider WHERE id = ?").get(id);
}
export function deleteLider(id) { db.prepare("DELETE FROM lider WHERE id = ?").run(id); }

/* ------------------------- Bairros ------------------------- */
export function createBairro({ municipio_codigo, nome, grupo = "Bairros" }) {
  const ordem = db.prepare("SELECT COALESCE(MAX(ordem), -1) + 1 AS o FROM bairro WHERE municipio_codigo = ?").get(municipio_codigo).o;
  const r = db.prepare("INSERT INTO bairro (municipio_codigo, nome, grupo, ordem) VALUES (?, ?, ?, ?)")
    .run(municipio_codigo, String(nome).trim(), grupo, ordem);
  return db.prepare("SELECT * FROM bairro WHERE id = ?").get(r.lastInsertRowid);
}
export function deleteBairro(id) { db.prepare("DELETE FROM bairro WHERE id = ?").run(id); }

export function assignLider(lider_id, bairro_id) {
  db.prepare("INSERT OR IGNORE INTO lider_bairro (lider_id, bairro_id) VALUES (?, ?)").run(lider_id, bairro_id);
}
export function unassignLider(lider_id, bairro_id) {
  db.prepare("DELETE FROM lider_bairro WHERE lider_id = ? AND bairro_id = ?").run(lider_id, bairro_id);
  db.prepare("UPDATE cabo SET lider_id = NULL WHERE bairro_id = ? AND lider_id = ?").run(bairro_id, lider_id);
}

/* ------------------------- Cabos ------------------------- */
export function createCabo({ nome, contato = "", bairro_id, lider_id = null }) {
  const r = db.prepare("INSERT INTO cabo (bairro_id, lider_id, nome, contato) VALUES (?, ?, ?, ?)")
    .run(bairro_id, lider_id ?? null, String(nome).trim(), contato);
  return db.prepare("SELECT * FROM cabo WHERE id = ?").get(r.lastInsertRowid);
}
export function updateCabo({ id, nome, contato, lider_id }) {
  const atual = db.prepare("SELECT lider_id FROM cabo WHERE id = ?").get(id);
  db.prepare("UPDATE cabo SET nome=COALESCE(?,nome), contato=COALESCE(?,contato), lider_id=? WHERE id=?")
    .run(nome ?? null, contato ?? null, lider_id === undefined ? (atual?.lider_id ?? null) : lider_id, id);
  return db.prepare("SELECT * FROM cabo WHERE id = ?").get(id);
}
export function deleteCabo(id) { db.prepare("DELETE FROM cabo WHERE id = ?").run(id); }

/* ------------------------- Equipe / Export ------------------------- */
export function getEquipe() {
  const lideres = db.prepare(`
    SELECT l.*, m.nome AS municipio_nome,
      (SELECT GROUP_CONCAT(b.nome, ', ') FROM lider_bairro lb JOIN bairro b ON b.id = lb.bairro_id WHERE lb.lider_id = l.id) AS bairros
    FROM lider l JOIN municipio m ON m.codigo = l.municipio_codigo
    ORDER BY m.nome COLLATE NOCASE, l.nome COLLATE NOCASE
  `).all();
  const cabos = db.prepare(`
    SELECT c.*, b.nome AS bairro_nome, m.nome AS municipio_nome, l.nome AS lider_nome
    FROM cabo c JOIN bairro b ON b.id = c.bairro_id JOIN municipio m ON m.codigo = b.municipio_codigo
    LEFT JOIN lider l ON l.id = c.lider_id
    ORDER BY m.nome COLLATE NOCASE, b.nome COLLATE NOCASE, c.nome COLLATE NOCASE
  `).all();
  return { lideres, cabos };
}

/* ------------------------- Dashboard ------------------------- */
export function getDashboard() {
  const est = getEstado();
  const comEquipe = est.filter((m) => m.total > 0);
  const nLideres = est.reduce((a, m) => a + m.nLideres, 0);
  const nCabos = est.reduce((a, m) => a + m.nCabos, 0);
  const nBairros = db.prepare("SELECT COUNT(*) n FROM bairro").get().n;
  const nEstrategias = db.prepare("SELECT COUNT(*) n FROM estrategia").get().n;
  const ranking = comEquipe.slice().sort((a, b) => (b.total - a.total) || (b.nLideres - a.nLideres));
  const coresRows = db.prepare("SELECT classificacao AS cor, COUNT(*) n FROM lider GROUP BY classificacao").all();
  const cores = { verde: 0, amarelo: 0, vermelho: 0, sem: 0 };
  for (const r of coresRows) cores[r.cor && cores[r.cor] !== undefined ? r.cor : "sem"] += r.n;
  return {
    nMunicipios: est.length,
    nCidadesComEquipe: comEquipe.length,
    nLideres, nCabos, nBairros, nEstrategias,
    sudoesteTotal: est.filter((m) => m.sudoeste).length,
    sudoesteComEquipe: est.filter((m) => m.sudoeste && m.total > 0).length,
    ranking,
    cores,
  };
}

/* ------------------------- Estratégias ------------------------- */
export function getEstrategias() {
  return db.prepare("SELECT * FROM estrategia ORDER BY id DESC").all();
}
export function createEstrategia({ titulo = "", texto = "", categoria = "Geral" }) {
  const r = db.prepare("INSERT INTO estrategia (titulo, texto, categoria) VALUES (?, ?, ?)").run(titulo, texto, categoria);
  return db.prepare("SELECT * FROM estrategia WHERE id = ?").get(r.lastInsertRowid);
}
export function updateEstrategia({ id, titulo, texto, categoria }) {
  db.prepare("UPDATE estrategia SET titulo=COALESCE(?,titulo), texto=COALESCE(?,texto), categoria=COALESCE(?,categoria) WHERE id=?")
    .run(titulo ?? null, texto ?? null, categoria ?? null, id);
  return db.prepare("SELECT * FROM estrategia WHERE id = ?").get(id);
}
export function deleteEstrategia(id) { db.prepare("DELETE FROM estrategia WHERE id = ?").run(id); }
export function importEstrategias(items) {
  const ins = db.prepare("INSERT INTO estrategia (titulo, texto, categoria) VALUES (?, ?, ?)");
  let n = 0;
  for (const it of items || []) {
    if (!it) continue;
    ins.run(it.titulo || "", it.descricao || it.texto || "", it.categoria || "Geral");
    n++;
  }
  return { importados: n };
}

// Importa o backup do app HTML de contatos (data = [{nome, codigo, regiao, pessoas:[{nome,cargo,obs}]}]).
export function importContatos(cities) {
  const byCodigo = db.prepare("SELECT codigo FROM municipio WHERE codigo = ?");
  const byNome = db.prepare("SELECT codigo FROM municipio WHERE nome = ? COLLATE NOCASE");
  const jaExiste = db.prepare("SELECT 1 FROM lider WHERE municipio_codigo = ? AND nome = ? COLLATE NOCASE LIMIT 1");
  const ins = db.prepare("INSERT INTO lider (municipio_codigo, nome, cargo, observacao) VALUES (?, ?, ?, ?)");
  let importados = 0, municipios = 0, pulados = 0, extras = 0;
  for (const c of cities || []) {
    let cod = null;
    if (c.codigo && byCodigo.get(Number(c.codigo))) cod = Number(c.codigo);
    else if (c.nome) { const r = byNome.get(String(c.nome)); if (r) cod = r.codigo; }
    const pessoas = (c.pessoas || []).filter((p) => p && p.nome && String(p.nome).trim());
    if (!cod) { extras += pessoas.length; continue; }
    let add = 0;
    for (const p of pessoas) {
      const nome = String(p.nome).trim();
      if (jaExiste.get(cod, nome)) { pulados++; continue; }
      ins.run(cod, nome, p.cargo || "", p.obs || "");
      importados++; add++;
    }
    if (add) municipios++;
  }
  return { importados, municipios, pulados, extras };
}

export function exportAll() {
  return {
    exportado_em: new Date().toISOString(),
    municipios: db.prepare("SELECT * FROM municipio ORDER BY nome").all(),
    bairros: db.prepare("SELECT * FROM bairro ORDER BY municipio_codigo, ordem").all(),
    lideres: db.prepare("SELECT * FROM lider ORDER BY id").all(),
    lider_bairro: db.prepare("SELECT * FROM lider_bairro").all(),
    cabos: db.prepare("SELECT * FROM cabo ORDER BY id").all(),
  };
}
