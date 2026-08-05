"use client";
import EstadoMap from "./EstadoMap";
import { cityTemperature } from "@/lib/temperature";

function noop() {}

export default function PrintableReport({ municipios }) {
  const withData = municipios
    .filter((city) => city.total > 0)
    .sort((a, b) => b.total - a.total || b.nLideres - a.nLideres);
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="print-only">
      <header className="print-header">
        <h1>Mapa de Goiás — Cobertura estadual</h1>
        <p>Campanha Dr. Lourival · gerado em {today}</p>
      </header>

      <EstadoMap municipios={municipios} onPreview={noop} />

      <h2 className="print-subhead">Municípios com dados cadastrados ({withData.length})</h2>
      <table className="print-table">
        <thead>
          <tr>
            <th>Município</th>
            <th>Sudoeste</th>
            <th>Líderes</th>
            <th>Cabos</th>
            <th>Temperatura</th>
            <th>Apoio</th>
            <th>Aproximação</th>
            <th>Resistência</th>
            <th>Sem leitura</th>
          </tr>
        </thead>
        <tbody>
          {withData.map((city) => {
            const temp = cityTemperature(city);
            return (
              <tr key={city.codigo}>
                <td>{city.nome}</td>
                <td>{city.sudoeste ? "Sim" : ""}</td>
                <td>{city.nLideres}</td>
                <td>{city.nCabos}</td>
                <td>{temp.label}</td>
                <td>{city.nVerde}</td>
                <td>{city.nAmarelo}</td>
                <td>{city.nVermelho}</td>
                <td>{city.nSem}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
