/**
 * Configuração central da landing page.
 *
 * Regras do briefing que este arquivo garante:
 *  - PROIBIDO: número de urna, a palavra "vote", logo antiga de partido.
 *  - Sempre "pré-candidato".
 *  - Mote oficial de adesão: "TÔ JUNTO COM DR. LOURIVAL" (exatamente assim).
 */

export const site = {
  nome: "Dr. Lourival Lobo",
  titulo: "Pré-candidato a Deputado Estadual",
  partido: "Podemos",
  cidade: "Mineiros",
  estado: "Goiás",

  url: "https://tocomdrlourival.com.br",
  descricao:
    "Tô Junto com Dr. Lourival — o movimento pra trazer a Cidade Saúde de volta e saúde de verdade para o interior de Goiás.",

  // Arroba oficial da campanha (Instagram e TikTok)
  arroba: "@drlourivallobo",
  instagramUrl: "https://www.instagram.com/drlourivallobo",

  /**
   * Link da comunidade do WhatsApp — A CAMPANHA FORNECE.
   * Enquanto estiver vazio, todos os botões de grupo levam para a seção
   * final (#movimento), onde está o formulário.
   */
  linkGrupoWhatsApp: "",

  // Chamadas oficiais (não alterar o texto)
  ctaGrupo: "ENTRAR NO GRUPO DE APOIO",
  ctaJunto: "TÔ JUNTO COM DR. LOURIVAL",
} as const;

/** Destino dos botões de grupo enquanto o link do WhatsApp não chega. */
export function hrefGrupo(): string {
  return site.linkGrupoWhatsApp || "#movimento";
}
