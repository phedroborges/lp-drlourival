"use client";
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Cell, Pie, PieChart } from "recharts";
import EstadoMap from "./EstadoMap";
import PrintableReport from "./PrintableReport";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TEMPERATURE_COLORS } from "@/lib/temperature";
const temperatureChartConfig = {
  valor: { label: "Pessoas" },
  apoio: { label: "Apoio", color: TEMPERATURE_COLORS.apoio },
  aproximacao: { label: "Aproximação", color: TEMPERATURE_COLORS.aproximacao },
  resistencia: { label: "Resistência", color: TEMPERATURE_COLORS.resistencia },
  semLeitura: { label: "Sem leitura", color: TEMPERATURE_COLORS.semLeitura },
};

function CityRow({ city, onPreview }) {
  return <Link className="cityrow" href={`/cidade/${city.codigo}`} onMouseEnter={() => onPreview(city)} onFocus={() => onPreview(city)}>
    <span className={`city-status tier-${city.tier}`} /><span className="nm">{city.nome}</span>
    {city.sudoeste ? <span className="sud">SO</span> : null}
    <span className="count">{city.total ? `${city.nLideres} líderes · ${city.nCabos} cabos` : "Sem equipe"}</span><span aria-hidden="true">›</span>
  </Link>;
}

function CityPreview({ city }) {
  if (!city) return null;
  const comLeitura = city.nVerde + city.nAmarelo + city.nVermelho;
  const coverage = city.nLideres ? Math.round((comLeitura / city.nLideres) * 100) : 0;
  return <Card className="city-preview-card">
    <div className="card-heading"><div><span className="card-kicker">Município selecionado</span><h3>{city.nome}</h3></div>{city.sudoeste ? <span className="soft-badge">Sudoeste</span> : null}</div>
    <div className="preview-stat-row"><div><strong>{city.nCoordenadores}</strong><span>Coordenação geral</span></div><div><strong>{city.nLideres}</strong><span>Lideranças locais</span></div><div><strong>{city.nCabos}</strong><span>Cabos locais</span></div></div>
    <div className="coverage-block"><div><span>Leitura política</span><strong>{coverage}%</strong></div><div className="progress-track"><i style={{ width: `${coverage}%` }} /></div><small>{comLeitura} de {city.nLideres} lideranças classificadas</small></div>
    <div className="temperature-legend compact"><span><i className="green" />{city.nVerde} apoio</span><span><i className="yellow" />{city.nAmarelo} aproximação</span><span><i className="red" />{city.nVermelho} resistência</span></div>
    <Link className="card-link" href={`/cidade/${city.codigo}`}>Abrir central municipal <span>→</span></Link>
  </Card>;
}

function TemperatureChart({ city }) {
  const chartData = [
    { key: "apoio", label: "Apoio", value: city?.nVerde || 0, fill: TEMPERATURE_COLORS.apoio },
    { key: "aproximacao", label: "Aproximação", value: city?.nAmarelo || 0, fill: TEMPERATURE_COLORS.aproximacao },
    { key: "resistencia", label: "Resistência", value: city?.nVermelho || 0, fill: TEMPERATURE_COLORS.resistencia },
    { key: "semLeitura", label: "Sem leitura", value: city?.nSem || 0, fill: TEMPERATURE_COLORS.semLeitura },
  ];
  return <Card className="temperature-card">
    <div className="card-heading"><div><span className="card-kicker">Leitura política</span><h3>Temperatura das lideranças</h3></div></div>
    <div className="donut-layout">
      <div className="relative mx-auto aspect-square h-[105px] w-[105px]">
        <ChartContainer config={temperatureChartConfig} className="mx-auto aspect-square h-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey="value" nameKey="label" innerRadius={34} outerRadius={52} strokeWidth={2}>
              {chartData.map((entry) => <Cell key={entry.key} fill={entry.fill} />)}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center leading-tight">
          <strong className="text-lg font-bold">{city?.nLideres || 0}</strong>
          <span className="text-[0.6rem] text-muted-foreground">pessoas</span>
        </div>
      </div>
      <div className="temperature-legend"><span><i className="green" />Apoio <strong>{city?.nVerde || 0}</strong></span><span><i className="yellow" />Aproximação <strong>{city?.nAmarelo || 0}</strong></span><span><i className="red" />Resistência <strong>{city?.nVermelho || 0}</strong></span><span><i className="neutral" />Sem leitura <strong>{city?.nSem || 0}</strong></span></div>
    </div>
  </Card>;
}

export default function EstadoView({ municipios }) {
  const [query, setQuery] = useState("");
  const mineiros = municipios.find((city) => city.nome === "Mineiros");
  const [preview, setPreview] = useState(mineiros || null);
  const handlePreview = useCallback((city) => city && setPreview(city), []);
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const totals = municipios.reduce((acc, city) => ({ lideres: acc.lideres + city.nLideres, cabos: acc.cabos + city.nCabos, cidades: acc.cidades + (city.total > 0 ? 1 : 0), comLeitura: acc.comLeitura + city.nVerde + city.nAmarelo + city.nVermelho }), { lideres: 0, cabos: 0, cidades: 0, comLeitura: 0 });
  const filtered = useMemo(() => municipios.filter((city) => !normalized || city.nome.toLocaleLowerCase("pt-BR").includes(normalized)), [municipios, normalized]);
  const southwest = filtered.filter((city) => city.sudoeste);
  const others = filtered.filter((city) => !city.sudoeste);

  return <main className="command-page modern-dashboard">
    <header className="dashboard-heading"><div><span className="eyebrow">Visão estadual</span><h1>Dashboard da campanha</h1><p>Acompanhe a estrutura territorial e identifique onde a equipe precisa avançar.</p></div>{mineiros ? <Link className="outline-action" href={`/cidade/${mineiros.codigo}`}>Abrir Mineiros <span>→</span></Link> : null}</header>

    <section className="kpi-grid modern-kpis">
      <Card className="kpi-card"><div className="kpi-icon blue">⌖</div><span>Municípios com equipe</span><strong>{totals.cidades}<small> / 246</small></strong><em className="trend positive">↑ em estruturação</em></Card>
      <Card className="kpi-card"><div className="kpi-icon violet">◉</div><span>Lideranças cadastradas</span><strong>{totals.lideres}</strong><em className="trend neutral">base estadual</em></Card>
      <Card className="kpi-card"><div className="kpi-icon orange">↗</div><span>Cabos eleitorais</span><strong>{totals.cabos}</strong><em className="trend neutral">em operação</em></Card>
      <Card className="kpi-card"><div className="kpi-icon green">✓</div><span>Lideranças com leitura</span><strong>{totals.comLeitura}</strong><em className="trend positive">classificadas</em></Card>
    </section>

    <section className="dashboard-grid">
      <Card className="state-map-card">
        <div className="card-heading"><div><span className="card-kicker">Cobertura estadual</span><h2>Mapa de Goiás</h2></div><button type="button" className="export-pdf-btn" onClick={() => window.print()}>⤓ Exportar PDF</button></div>
        <EstadoMap municipios={municipios} onPreview={handlePreview} />
      </Card>
      <div className="analytics-column"><CityPreview city={preview} /><TemperatureChart city={preview || mineiros} /></div>
    </section>

    <Card className="city-directory">
      <div className="directory-head"><div><span className="card-kicker">Operação territorial</span><h2>Municípios</h2><p>Passe sobre uma cidade para atualizar os indicadores ao lado do mapa.</p></div><label className="search-field"><span>⌕</span><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar município" /></label></div>
      <div className="citylist">{normalized ? filtered.map((city) => <CityRow key={city.codigo} city={city} onPreview={setPreview} />) : <><div className="subhead">Sudoeste Goiano <span>{southwest.length}</span></div>{southwest.map((city) => <CityRow key={city.codigo} city={city} onPreview={setPreview} />)}<div className="subhead">Demais municípios <span>{others.length}</span></div>{others.map((city) => <CityRow key={city.codigo} city={city} onPreview={setPreview} />)}</>}{!filtered.length ? <div className="empty">Nenhum município encontrado.</div> : null}</div>
    </Card>

    <PrintableReport municipios={municipios} />
  </main>;
}
