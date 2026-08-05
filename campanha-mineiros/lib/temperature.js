export const TEMPERATURE_COLORS = {
  apoio: "#21a56b",
  aproximacao: "#f4b740",
  resistencia: "#ee6a5c",
  semLeitura: "#e2e6ec",
  semEquipe: "#f8f9fb",
};

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixHex(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const rgb = a.map((c, i) => Math.round(c + (b[i] - c) * t));
  return `rgb(${rgb.join(",")})`;
}

// Temperatura de apoio de um município: combina o saldo verde/vermelho das
// lideranças classificadas numa escala contínua vermelho -> amarelo -> verde.
export function cityTemperature(city) {
  const lideres = city?.nLideres || 0;
  if (!lideres) {
    return { score: null, color: TEMPERATURE_COLORS.semLeitura, label: "Sem leitura" };
  }
  const verde = city.nVerde || 0;
  const vermelho = city.nVermelho || 0;
  const score = (verde - vermelho) / lideres;
  const color = score >= 0
    ? mixHex(TEMPERATURE_COLORS.aproximacao, TEMPERATURE_COLORS.apoio, score)
    : mixHex(TEMPERATURE_COLORS.aproximacao, TEMPERATURE_COLORS.resistencia, -score);
  const label = score > 0.15 ? "Apoio" : score < -0.15 ? "Resistência" : "Aproximação";
  return { score, color, label };
}
