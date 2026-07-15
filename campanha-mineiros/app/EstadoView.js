"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import EstadoMap from "./EstadoMap";

function CityRow({ city, onPreview }) {
  return (
    <Link
      className="cityrow"
      href={`/cidade/${city.codigo}`}
      onMouseEnter={() => onPreview(city)}
      onFocus={() => onPreview(city)}
    >
      <span className={`city-status tier-${city.tier}`} />
      <span className="nm">{city.nome}</span>
      {city.sudoeste ? <span className="sud">SO</span> : null}
      <span className="count">{city.total ? `${city.nLideres} líderes · ${city.nCabos} cabos` : "Estruturar"}</span>
      <span aria-hidden="true">→</span>
    </Link>
  );
}

function Preview({ city }) {
  if (!city) return (
    <div className="city-preview empty-preview">
      <span className="preview-icon">↗</span>
      <strong>Passe sobre uma cidade</strong>
      <p>Veja a estrutura sem sair do mapa. Clique apenas quando quiser abrir a operação completa.</p>
    </div>
  );
  return (
    <div className="city-preview">
      <div className="preview-top">
        <div><span className="micro-label">Prévia territorial</span><h2>{city.nome}</h2></div>
        {city.sudoeste ? <span className="focus-tag">Foco Sudoeste</span> : null}
      </div>
      <div className="preview-metrics">
        <div><strong>{city.nCoordenadores}</strong><span>coordenação</span></div>
        <div><strong>{city.nLideres}</strong><span>lideranças</span></div>
        <div><strong>{city.nCabos}</strong><span>cabos</span></div>
        <div><strong>{city.nBairrosAtivos}/{city.nBairros}</strong><span>territórios ativos</span></div>
      </div>
      <div className="temperature-line">
        <span className="temp green">{city.nVerde} apoio</span>
        <span className="temp yellow">{city.nAmarelo} aproximação</span>
        <span className="temp red">{city.nVermelho} resistência</span>
        <span className="temp neutral">{city.nSem} sem leitura</span>
      </div>
      <Link className="primary-link" href={`/cidade/${city.codigo}`}>Abrir central de {city.nome} →</Link>
    </div>
  );
}

export default function EstadoView({ municipios }) {
  const [query, setQuery] = useState("");
  const mineiros = municipios.find((city) => city.nome === "Mineiros");
  const [preview, setPreview] = useState(mineiros || null);
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const totals = municipios.reduce((acc, city) => ({
    lideres: acc.lideres + city.nLideres,
    cabos: acc.cabos + city.nCabos,
    cidades: acc.cidades + (city.total > 0 ? 1 : 0),
  }), { lideres: 0, cabos: 0, cidades: 0 });

  const filtered = useMemo(() => municipios.filter((city) =>
    !normalized || city.nome.toLocaleLowerCase("pt-BR").includes(normalized)
  ), [municipios, normalized]);
  const southwest = filtered.filter((city) => city.sudoeste);
  const others = filtered.filter((city) => !city.sudoeste);

  return (
    <main className="command-page">
      <header className="command-hero">
        <div>
          <span className="eyebrow">Central territorial · Goiás</span>
          <h1>Enxergue a campanha antes de decidir o próximo passo.</h1>
          <p>Comece pelo mapa, confira a estrutura de cada cidade sem sair da tela e entre apenas onde houver trabalho a fazer.</p>
        </div>
        {mineiros ? <Link className="hero-action" href={`/cidade/${mineiros.codigo}`}><span>Prioridade atual</span><strong>Abrir Mineiros</strong> →</Link> : null}
      </header>

      <section className="onboarding-strip" aria-label="Como usar o sistema">
        <div><span>1</span><p><strong>Leia o mapa</strong> Passe sobre uma cidade para conferir a estrutura.</p></div>
        <div><span>2</span><p><strong>Organize a equipe</strong> Coordenação, líderes e cabos em uma única visão.</p></div>
        <div><span>3</span><p><strong>Planeje as ruas</strong> Monte as rotas operacionais no mapa da cidade.</p></div>
      </section>

      <section className="kpi-grid">
        <article><span>Presença estadual</span><strong>{totals.cidades}<small>/246 cidades</small></strong></article>
        <article><span>Lideranças</span><strong>{totals.lideres}</strong></article>
        <article><span>Cabos eleitorais</span><strong>{totals.cabos}</strong></article>
        <article><span>Próxima ação</span><strong className="action-copy">Estruturar territórios</strong></article>
      </section>

      <section className="state-workspace">
        <div className="mapcard"><EstadoMap municipios={municipios} onPreview={(city) => city && setPreview(city)} /></div>
        <Preview city={preview} />
      </section>

      <section className="city-directory">
        <div className="directory-head">
          <div><span className="eyebrow">Operação por município</span><h2>Escolha onde trabalhar</h2></div>
          <label className="search-field"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar município" /></label>
        </div>
        <div className="citylist">
          {normalized ? filtered.map((city) => <CityRow key={city.codigo} city={city} onPreview={setPreview} />) : <>
            <div className="subhead">Sudoeste Goiano <span>{southwest.length}</span></div>
            {southwest.map((city) => <CityRow key={city.codigo} city={city} onPreview={setPreview} />)}
            <div className="subhead">Demais municípios <span>{others.length}</span></div>
            {others.map((city) => <CityRow key={city.codigo} city={city} onPreview={setPreview} />)}
          </>}
          {!filtered.length ? <div className="empty">Nenhum município encontrado.</div> : null}
        </div>
      </section>
    </main>
  );
}
