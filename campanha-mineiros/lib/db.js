// Banco de dados local SQLite (driver nativo do Node 24: node:sqlite).
// Roda SOMENTE no servidor.
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
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
    CREATE TABLE IF NOT EXISTS rota (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      municipio_codigo INTEGER NOT NULL,
      nome             TEXT NOT NULL,
      status           TEXT NOT NULL DEFAULT 'planejamento',
      geometria        TEXT NOT NULL DEFAULT '',
      distancia_m      REAL NOT NULL DEFAULT 0,
      duracao_s        REAL NOT NULL DEFAULT 0,
      criado_em        TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (municipio_codigo) REFERENCES municipio(codigo) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS rota_ponto (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      rota_id   INTEGER NOT NULL,
      cabo_id   INTEGER,
      bairro_id INTEGER,
      label     TEXT NOT NULL DEFAULT '',
      lat       REAL NOT NULL,
      lng       REAL NOT NULL,
      ordem     INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (rota_id) REFERENCES rota(id) ON DELETE CASCADE,
      FOREIGN KEY (cabo_id) REFERENCES cabo(id) ON DELETE SET NULL,
      FOREIGN KEY (bairro_id) REFERENCES bairro(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS tarefa_rota (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      rota_id     INTEGER NOT NULL,
      bairro_id   INTEGER,
      data        TEXT NOT NULL,
      turno       TEXT NOT NULL DEFAULT 'Manhã',
      observacao  TEXT NOT NULL DEFAULT '',
      token       TEXT NOT NULL UNIQUE,
      status      TEXT NOT NULL DEFAULT 'planejada',
      criado_em   TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (rota_id) REFERENCES rota(id) ON DELETE CASCADE,
      FOREIGN KEY (bairro_id) REFERENCES bairro(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS tarefa_rota_cabo (
      tarefa_id    INTEGER NOT NULL,
      cabo_id      INTEGER NOT NULL,
      status       TEXT NOT NULL DEFAULT 'pendente',
      iniciado_em  TEXT,
      concluido_em TEXT,
      observacao   TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (tarefa_id, cabo_id),
      FOREIGN KEY (tarefa_id) REFERENCES tarefa_rota(id) ON DELETE CASCADE,
      FOREIGN KEY (cabo_id) REFERENCES cabo(id) ON DELETE CASCADE
    );
  `);

  // Migrações incrementais para instalações que já possuem dados.
  const ensureColumn = (table, column, definition) => {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!columns.some((item) => item.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  };
  ensureColumn("lider", "nivel", "TEXT NOT NULL DEFAULT 'lideranca'");
  ensureColumn("lider", "responsavel_id", "INTEGER");
  ensureColumn("lider", "endereco", "TEXT NOT NULL DEFAULT ''");
  ensureColumn("lider", "lat", "REAL");
  ensureColumn("lider", "lng", "REAL");
  ensureColumn("bairro", "lat", "REAL");
  ensureColumn("bairro", "lng", "REAL");
  ensureColumn("cabo", "endereco", "TEXT NOT NULL DEFAULT ''");
  ensureColumn("cabo", "lat", "REAL");
  ensureColumn("cabo", "lng", "REAL");
  ensureColumn("rota", "bairro_id", "INTEGER");

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
    const pedro = db.prepare("SELECT id FROM lider WHERE municipio_codigo = ? AND nome = ?").get(MINEIROS_CODIGO, "Pedro Borges");
    if (!pedro) {
      db.prepare(`INSERT INTO lider
        (municipio_codigo, nome, cargo, contato, classificacao, observacao, nivel)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(MINEIROS_CODIGO, "Pedro Borges", "Coordenação municipal", "(64) 99999-0001", "verde", "Coordenador responsável pela operação de Mineiros", "coordenacao");
    }
  }

  return db;
}

function getDb() {
  if (!globalThis.__campanhaDb) globalThis.__campanhaDb = init();
  return globalThis.__campanhaDb;
}

// Mantém a API interna existente, mas só abre o SQLite na primeira consulta.
export const db = new Proxy({}, {
  get(_target, property) {
    const database = getDb();
    const value = database[property];
    return typeof value === "function" ? value.bind(database) : value;
  },
});

function tierOf(total) { return total === 0 ? 0 : total === 1 ? 1 : total <= 3 ? 2 : 3; }

/* ------------------------- Estado (mapa) ------------------------- */
export function getEstado() {
  const rows = db.prepare(`
    SELECT m.codigo, m.nome, m.sudoeste,
      (SELECT COUNT(*) FROM lider l WHERE l.municipio_codigo = m.codigo) AS nLideres,
      (SELECT COUNT(*) FROM lider l WHERE l.municipio_codigo = m.codigo AND l.nivel = 'coordenacao') AS nCoordenadores,
      (SELECT COUNT(*) FROM cabo c JOIN bairro b ON b.id = c.bairro_id WHERE b.municipio_codigo = m.codigo) AS nCabos,
      (SELECT COUNT(*) FROM bairro b WHERE b.municipio_codigo = m.codigo) AS nBairros,
      (SELECT COUNT(DISTINCT b.id) FROM bairro b
        WHERE b.municipio_codigo = m.codigo AND (
          EXISTS (SELECT 1 FROM lider_bairro lb WHERE lb.bairro_id = b.id)
          OR EXISTS (SELECT 1 FROM cabo c WHERE c.bairro_id = b.id)
        )) AS nBairrosAtivos,
      (SELECT COUNT(*) FROM lider l WHERE l.municipio_codigo = m.codigo AND l.classificacao = 'verde') AS nVerde,
      (SELECT COUNT(*) FROM lider l WHERE l.municipio_codigo = m.codigo AND l.classificacao = 'amarelo') AS nAmarelo,
      (SELECT COUNT(*) FROM lider l WHERE l.municipio_codigo = m.codigo AND l.classificacao = 'vermelho') AS nVermelho,
      (SELECT COUNT(*) FROM lider l WHERE l.municipio_codigo = m.codigo AND l.classificacao = '') AS nSem
    FROM municipio m ORDER BY m.nome COLLATE NOCASE
  `).all();
  return rows.map((r) => ({ ...r, total: r.nLideres + r.nCabos, tier: tierOf(r.nLideres + r.nCabos) }));
}

/* ------------------------- Cidade ------------------------- */
export function getMunicipio(codigo) {
  const m = db.prepare("SELECT * FROM municipio WHERE codigo = ?").get(codigo);
  if (!m) return null;
  const lideres = db.prepare("SELECT * FROM lider WHERE municipio_codigo = ? ORDER BY CASE nivel WHEN 'coordenacao' THEN 0 ELSE 1 END, nome COLLATE NOCASE").all(codigo);
  const bairros = db.prepare("SELECT * FROM bairro WHERE municipio_codigo = ? ORDER BY ordem, nome").all(codigo);
  const bairrosPorLider = new Map();
  const bid = new Map(bairros.map((b) => [b.id, { ...b, lideres: [], cabos: [] }]));
  if (bairros.length) {
    const ph = bairros.map(() => "?").join(",");
    const ids = bairros.map((b) => b.id);
    for (const row of db.prepare(
      `SELECT lb.bairro_id, l.id, l.nome, l.cargo, l.contato, l.classificacao, l.nivel, l.responsavel_id
         FROM lider_bairro lb JOIN lider l ON l.id = lb.lider_id
        WHERE lb.bairro_id IN (${ph}) ORDER BY l.nome COLLATE NOCASE`
    ).all(...ids)) {
      bid.get(row.bairro_id)?.lideres.push({ id: row.id, nome: row.nome, cargo: row.cargo, contato: row.contato, classificacao: row.classificacao, nivel: row.nivel, responsavel_id: row.responsavel_id });
      if (!bairrosPorLider.has(row.id)) bairrosPorLider.set(row.id, []);
      bairrosPorLider.get(row.id).push(row.bairro_id);
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
  const rotas = getRotas(codigo);
  const tarefas = getTarefas(codigo);
  return { ...m, lideres: lideres.map((lider) => ({ ...lider, bairro_ids: bairrosPorLider.get(lider.id) || [] })), grupos, rotas, tarefas };
}

/* ------------------------- Lideranças ------------------------- */
export function createLider({ municipio_codigo, nome, cargo = "", contato = "", classificacao = "", observacao = "", nivel = "lideranca", responsavel_id = null, endereco = "", lat = null, lng = null, bairro_ids = [] }) {
  const r = db.prepare(
    "INSERT INTO lider (municipio_codigo, nome, cargo, contato, classificacao, observacao, nivel, responsavel_id, endereco, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(municipio_codigo, String(nome).trim(), cargo, contato, classificacao, observacao, nivel, responsavel_id || null, endereco, lat, lng);
  for (const bairroId of bairro_ids || []) assignLider(Number(r.lastInsertRowid), Number(bairroId));
  return db.prepare("SELECT * FROM lider WHERE id = ?").get(r.lastInsertRowid);
}
export function updateLider({ id, nome, cargo, contato, classificacao, observacao, nivel, responsavel_id, endereco, lat, lng, bairro_ids }) {
  const atual = db.prepare("SELECT responsavel_id, lat, lng FROM lider WHERE id = ?").get(id);
  db.prepare(
    `UPDATE lider SET nome=COALESCE(?,nome), cargo=COALESCE(?,cargo), contato=COALESCE(?,contato),
       classificacao=COALESCE(?,classificacao), observacao=COALESCE(?,observacao), nivel=COALESCE(?,nivel),
       responsavel_id=?, endereco=COALESCE(?,endereco), lat=?, lng=? WHERE id=?`
  ).run(nome ?? null, cargo ?? null, contato ?? null, classificacao ?? null, observacao ?? null, nivel ?? null,
    responsavel_id === undefined ? (atual?.responsavel_id ?? null) : (responsavel_id || null), endereco ?? null,
    lat === undefined ? (atual?.lat ?? null) : lat, lng === undefined ? (atual?.lng ?? null) : lng, id);
  if (Array.isArray(bairro_ids)) {
    db.prepare("DELETE FROM lider_bairro WHERE lider_id = ?").run(id);
    for (const bairroId of bairro_ids) assignLider(id, Number(bairroId));
  }
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
export function createCabo({ nome, contato = "", bairro_id, lider_id = null, endereco = "", lat = null, lng = null }) {
  const r = db.prepare("INSERT INTO cabo (bairro_id, lider_id, nome, contato, endereco, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(bairro_id, lider_id ?? null, String(nome).trim(), contato, endereco, lat, lng);
  return db.prepare("SELECT * FROM cabo WHERE id = ?").get(r.lastInsertRowid);
}
export function updateCabo({ id, nome, contato, lider_id, bairro_id, endereco, lat, lng }) {
  const atual = db.prepare("SELECT lider_id, bairro_id, lat, lng FROM cabo WHERE id = ?").get(id);
  db.prepare("UPDATE cabo SET nome=COALESCE(?,nome), contato=COALESCE(?,contato), lider_id=?, bairro_id=?, endereco=COALESCE(?,endereco), lat=?, lng=? WHERE id=?")
    .run(nome ?? null, contato ?? null, lider_id === undefined ? (atual?.lider_id ?? null) : lider_id,
      bairro_id ?? atual?.bairro_id, endereco ?? null, lat === undefined ? (atual?.lat ?? null) : lat,
      lng === undefined ? (atual?.lng ?? null) : lng, id);
  return db.prepare("SELECT * FROM cabo WHERE id = ?").get(id);
}
export function deleteCabo(id) { db.prepare("DELETE FROM cabo WHERE id = ?").run(id); }

/* ------------------------- Rotas de rua ------------------------- */
export function getRotas(municipio_codigo) {
  const rotas = db.prepare(`SELECT r.*, b.nome AS bairro_nome FROM rota r
    LEFT JOIN bairro b ON b.id = r.bairro_id WHERE r.municipio_codigo = ? ORDER BY r.id DESC`).all(municipio_codigo);
  const pontosQuery = db.prepare(`
    SELECT rp.*, c.nome AS cabo_nome, b.nome AS bairro_nome
      FROM rota_ponto rp
      LEFT JOIN cabo c ON c.id = rp.cabo_id
      LEFT JOIN bairro b ON b.id = rp.bairro_id
     WHERE rp.rota_id = ? ORDER BY rp.ordem, rp.id
  `);
  return rotas.map((rota) => ({
    ...rota,
    geometria: rota.geometria ? JSON.parse(rota.geometria) : null,
    pontos: pontosQuery.all(rota.id),
  }));
}
export function createRota({ municipio_codigo, nome, bairro_id = null }) {
  const r = db.prepare("INSERT INTO rota (municipio_codigo, nome, bairro_id) VALUES (?, ?, ?)").run(municipio_codigo, String(nome).trim(), bairro_id || null);
  return getRotas(municipio_codigo).find((rota) => rota.id === Number(r.lastInsertRowid));
}
export function updateRota({ id, nome, bairro_id, status, geometria, distancia_m, duracao_s }) {
  db.prepare(`UPDATE rota SET nome=COALESCE(?,nome), status=COALESCE(?,status), geometria=COALESCE(?,geometria),
    distancia_m=COALESCE(?,distancia_m), duracao_s=COALESCE(?,duracao_s), bairro_id=COALESCE(?,bairro_id) WHERE id=?`)
    .run(nome ?? null, status ?? null, geometria === undefined ? null : JSON.stringify(geometria || null), distancia_m ?? null, duracao_s ?? null, bairro_id ?? null, id);
  return db.prepare("SELECT * FROM rota WHERE id = ?").get(id);
}
export function deleteRota(id) { db.prepare("DELETE FROM rota WHERE id = ?").run(id); }
export function createRotaPonto({ rota_id, cabo_id = null, bairro_id = null, label = "", lat, lng }) {
  const ordem = db.prepare("SELECT COALESCE(MAX(ordem), -1) + 1 AS o FROM rota_ponto WHERE rota_id = ?").get(rota_id).o;
  const r = db.prepare("INSERT INTO rota_ponto (rota_id, cabo_id, bairro_id, label, lat, lng, ordem) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(rota_id, cabo_id, bairro_id, label, lat, lng, ordem);
  return db.prepare("SELECT * FROM rota_ponto WHERE id = ?").get(r.lastInsertRowid);
}
export function updateRotaPonto({ id, label, ordem }) {
  db.prepare("UPDATE rota_ponto SET label=COALESCE(?,label), ordem=COALESCE(?,ordem) WHERE id=?").run(label ?? null, ordem ?? null, id);
  return db.prepare("SELECT * FROM rota_ponto WHERE id = ?").get(id);
}
export function deleteRotaPonto(id) { db.prepare("DELETE FROM rota_ponto WHERE id = ?").run(id); }

/* ------------------------- Operação de campo ------------------------- */
function statusDaTarefa(tarefa) {
  if (tarefa.status === "cancelada") return "cancelada";
  const total = tarefa.cabos.length;
  const concluidos = tarefa.cabos.filter((cabo) => cabo.status === "concluida").length;
  const iniciados = tarefa.cabos.filter((cabo) => cabo.status === "andamento").length;
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  if (total && concluidos === total) return "concluida";
  if (iniciados || concluidos) return "andamento";
  if (tarefa.data < hoje) return "atrasada";
  return "planejada";
}

function montarTarefa(tarefa) {
  if (!tarefa) return null;
  const cabos = db.prepare(`SELECT trc.*, c.nome, c.contato
    FROM tarefa_rota_cabo trc JOIN cabo c ON c.id = trc.cabo_id
    WHERE trc.tarefa_id = ? ORDER BY c.nome COLLATE NOCASE`).all(tarefa.id);
  const pontos = db.prepare("SELECT * FROM rota_ponto WHERE rota_id = ? ORDER BY ordem, id").all(tarefa.rota_id);
  const result = { ...tarefa, cabos, pontos };
  result.status_calculado = statusDaTarefa(result);
  result.concluidos = cabos.filter((cabo) => cabo.status === "concluida").length;
  return result;
}

export function getTarefas(municipio_codigo) {
  return db.prepare(`SELECT t.*, r.nome AS rota_nome, r.municipio_codigo, b.nome AS bairro_nome
    FROM tarefa_rota t JOIN rota r ON r.id = t.rota_id
    LEFT JOIN bairro b ON b.id = t.bairro_id
    WHERE r.municipio_codigo = ? ORDER BY t.data DESC, t.id DESC`).all(municipio_codigo).map(montarTarefa);
}

export function getTarefaByToken(token) {
  const tarefa = db.prepare(`SELECT t.*, r.nome AS rota_nome, r.municipio_codigo, m.nome AS municipio_nome,
    b.nome AS bairro_nome FROM tarefa_rota t JOIN rota r ON r.id = t.rota_id
    JOIN municipio m ON m.codigo = r.municipio_codigo LEFT JOIN bairro b ON b.id = t.bairro_id
    WHERE t.token = ?`).get(token);
  return montarTarefa(tarefa);
}

export function createTarefa({ rota_id, bairro_id = null, data, turno = "Manhã", observacao = "", cabo_ids = [] }) {
  const rota = db.prepare("SELECT * FROM rota WHERE id = ?").get(rota_id);
  if (!rota) throw new Error("Rota não encontrada");
  if (rota.status !== "finalizada") throw new Error("Finalize a rota antes de criar o plano de campo");
  const pointCount = db.prepare("SELECT COUNT(*) AS total FROM rota_ponto WHERE rota_id = ?").get(rota_id).total;
  if (pointCount < 2) throw new Error("A rota precisa ter partida e chegada");
  const targetBairro = Number(bairro_id || rota.bairro_id);
  if (!targetBairro) throw new Error("Escolha o bairro atendido pela rota");
  const uniqueCabos = [...new Set(cabo_ids.map(Number))];
  const caboNoBairro = db.prepare("SELECT 1 FROM cabo WHERE id = ? AND bairro_id = ?");
  if (uniqueCabos.some((caboId) => !caboNoBairro.get(caboId, targetBairro))) {
    throw new Error("Todos os cabos precisam pertencer ao bairro escolhido");
  }
  const token = randomUUID();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = db.prepare(`INSERT INTO tarefa_rota (rota_id, bairro_id, data, turno, observacao, token)
      VALUES (?, ?, ?, ?, ?, ?)`).run(rota_id, targetBairro, data, turno, observacao, token);
    const tarefaId = Number(result.lastInsertRowid);
    const insertCabo = db.prepare("INSERT INTO tarefa_rota_cabo (tarefa_id, cabo_id) VALUES (?, ?)");
    for (const caboId of uniqueCabos) insertCabo.run(tarefaId, caboId);
    db.exec("COMMIT");
    return getTarefaByToken(token);
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function updateTarefaCabo({ token, cabo_id, status, observacao }) {
  const allowed = new Set(["pendente", "andamento", "concluida"]);
  if (!allowed.has(status)) throw new Error("Status inválido");
  const tarefa = db.prepare("SELECT id FROM tarefa_rota WHERE token = ?").get(token);
  if (!tarefa) throw new Error("Plano de campo não encontrado");
  const atual = db.prepare("SELECT * FROM tarefa_rota_cabo WHERE tarefa_id = ? AND cabo_id = ?").get(tarefa.id, cabo_id);
  if (!atual) throw new Error("Cabo não pertence a este plano");
  const iniciado = status === "andamento" && !atual.iniciado_em ? new Date().toISOString() : atual.iniciado_em;
  const concluido = status === "concluida" ? new Date().toISOString() : null;
  db.prepare(`UPDATE tarefa_rota_cabo SET status=?, iniciado_em=?, concluido_em=?, observacao=COALESCE(?,observacao)
    WHERE tarefa_id=? AND cabo_id=?`).run(status, iniciado, concluido, observacao ?? null, tarefa.id, cabo_id);
  return getTarefaByToken(token);
}

export function deleteTarefa(id) { db.prepare("DELETE FROM tarefa_rota WHERE id = ?").run(id); }

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
    rotas: db.prepare("SELECT * FROM rota ORDER BY id").all(),
    rota_pontos: db.prepare("SELECT * FROM rota_ponto ORDER BY rota_id, ordem").all(),
    tarefas_rota: db.prepare("SELECT * FROM tarefa_rota ORDER BY id").all(),
    tarefas_cabos: db.prepare("SELECT * FROM tarefa_rota_cabo ORDER BY tarefa_id, cabo_id").all(),
  };
}
