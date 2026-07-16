"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import EstadoMap from "./EstadoMap";

function CityRow({ city, onPreview }) {
  return <Link className="cityrow" href={`/cidade/${city.codigo}`} onMouseEnter={() => onPreview(city)} onFocus={() => onPreview(city)}>
    <span className={`city-status tier-${city.tier}`} /><span className="nm">{city.nome}</span>
    {city.sudoeste ? <span className="sud">SO</span> : null}
    <span className="count">{city.total ? `${city.nLideres} líderes · ${city.nCabos} cabos` : "Sem equipe"}</span><span aria-hidden="true">›</span>
  </Link>;
}

function CityPreview({ city }) {
  if (!city) return null;
  const coverage = city.nBairros ? Math.round((city.nBairrosAtivos / city.nBairros) * 100) : 0;
  return <article className="analytics-card city-preview-card">
    <div className="card-heading"><div><span className="card-kicker">Município selecionado</span><h3>{city.nome}</h3></div>{city.sudoeste ? <span className="soft-badge">Sudoeste</span> : null}</div>
    <div className="preview-stat-row"><div><strong>{city.nCoordenadores}</strong><span>Coordenação geral</span></div><div><strong>{city.nLideres}</strong><span>Lideranças locais</span></div><div><strong>{city.nCabos}</strong><span>Cabos locais</span></div></div>
    <div className="coverage-block"><div><span>Cobertura territorial</span><strong>{coverage}%</strong></div><div className="progress-track"><i style={{ width: `${coverage}%` }} /></div><small>{city.nBairrosAtivos} de {city.nBairros} territórios ativos</small></div>
    <div className="temperature-legend compact"><span><i className="green" />{city.nVerde} apoio</span><span><i className="yellow" />{city.nAmarelo} aproximação</span><span><i className="red" />{city.nVermelho} resistência</span></div>
    <Link className="card-link" href={`/cidade/${city.codigo}`}>Abrir central municipal <span>→</span></Link>
  </article>;
}

function TemperatureChart({ city }) {
  const total = Math.max(1, city?.nLideres || 0);
  const green = ((city?.nVerde || 0) / total) * 100;
  const yellow = ((city?.nAmarelo || 0) / total) * 100;
  const red = ((city?.nVermelho || 0) / total) * 100;
  const chart = `conic-gradient(#21a56b 0 ${green}%, #f4b740 ${green}% ${green + yellow}%, #ee6a5c ${green + yellow}% ${green + yellow + red}%, #e7eaee ${green + yellow + red}% 100%)`;
  return <article className="analytics-card temperature-card">
    <div className="card-heading"><div><span className="card-kicker">Leitura política</span><h3>Temperatura das lideranças</h3></div><span className="more-button">•••</span></div>
    <div className="donut-layout"><div className="donut-chart" style={{ background: chart }}><div><strong>{city?.nLideres || 0}</strong><span>pessoas</span></div></div><div className="temperature-legend"><span><i className="green" />Apoio <strong>{city?.nVerde || 0}</strong></span><span><i className="yellow" />Aproximação <strong>{city?.nAmarelo || 0}</strong></span><span><i className="red" />Resistência <strong>{city?.nVermelho || 0}</strong></span><span><i className="neutral" />Sem leitura <strong>{city?.nSem || 0}</strong></span></div></div>
  </article>;
}

export default function EstadoView({ municipios }) {
  const [query, setQuery] = useState("");
  const mineiros = municipios.find((city) => city.nome === "Mineiros");
  const [preview, setPreview] = useState(mineiros || null);
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const totals = municipios.reduce((acc, city) => ({ lideres: acc.lideres + city.nLideres, cabos: acc.cabos + city.nCabos, cidades: acc.cidades + (city.total > 0 ? 1 : 0), territorios: acc.territorios + city.nBairrosAtivos }), { lideres: 0, cabos: 0, cidades: 0, territorios: 0 });
  const filtered = useMemo(() => municipios.filter((city) => !normalized || city.nome.toLocaleLowerCase("pt-BR").includes(normalized)), [municipios, normalized]);
  const southwest = filtered.filter((city) => city.sudoeste);
  const others = filtered.filter((city) => !city.sudoeste);

  return <main className="command-page modern-dashboard">
    <header className="dashboard-heading"><div><span className="eyebrow">Visão estadual</span><h1>Dashboard da campanha</h1><p>Acompanhe a estrutura territorial e identifique onde a equipe precisa avançar.</p></div>{mineiros ? <Link className="outline-action" href={`/cidade/${mineiros.codigo}`}>Abrir Mineiros <span>→</span></Link> : null}</header>

    <section className="kpi-grid modern-kpis">
      <article><div className="kpi-icon blue">⌖</div><span>Municípios com equipe</span><strong>{totals.cidades}<small> / 246</small></strong><em className="trend positive">↑ em estruturação</em></article>
      <article><div className="kpi-icon violet">◉</div><span>Lideranças cadastradas</span><strong>{totals.lideres}</strong><em className="trend neutral">base estadual</em></article>
      <article><div className="kpi-icon orange">↗</div><span>Cabos eleitorais</span><strong>{totals.cabos}</strong><em className="trend neutral">em operação</em></article>
      <article><div className="kpi-icon green">✓</div><span>Territórios ativos</span><strong>{totals.territorios}</strong><em className="trend positive">cobertura atual</em></article>
    </section>

    <section className="dashboard-grid">
      <article className="analytics-card state-map-card">
        <div className="card-heading"><div><span className="card-kicker">Cobertura estadual</span><h2>Mapa de Goiás</h2></div><div className="map-status"><span><i />Com estrutura</span><span><i />Sem estrutura</span></div></div>
        <EstadoMap municipios={municipios} onPreview={(city) => city && setPreview(city)} />
      </article>
      <div className="analytics-column"><CityPreview city={preview} /><TemperatureChart city={preview || mineiros} /></div>
    </section>

    <section className="analytics-card city-directory">
      <div className="directory-head"><div><span className="card-kicker">Operação territorial</span><h2>Municípios</h2><p>Passe sobre uma cidade para atualizar os indicadores ao lado do mapa.</p></div><label className="search-field"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar município" /></label></div>
      <div className="citylist">{normalized ? filtered.map((city) => <CityRow key={city.codigo} city={city} onPreview={setPreview} />) : <><div className="subhead">Sudoeste Goiano <span>{southwest.length}</span></div>{southwest.map((city) => <CityRow key={city.codigo} city={city} onPreview={setPreview} />)}<div className="subhead">Demais municípios <span>{others.length}</span></div>{others.map((city) => <CityRow key={city.codigo} city={city} onPreview={setPreview} />)}</>}{!filtered.length ? <div className="empty">Nenhum município encontrado.</div> : null}</div>
    </section>
  </main>;
}
