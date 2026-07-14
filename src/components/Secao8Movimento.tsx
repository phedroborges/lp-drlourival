"use client";

import { useState, type FormEvent } from "react";
import { site, hrefGrupo } from "@/config/site";
import { IconeWhatsApp } from "@/components/ui/IconeWhatsApp";

/**
 * SEÇÃO 8 — O MOVIMENTO. A conversão final.
 * Fundo laranja, título gigante em creme, botão enorme em AZUL
 * (cores invertidas de propósito para o botão saltar).
 * Sem animação nenhuma: tudo direto.
 */
export function Secao8Movimento() {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    const form = e.currentTarget;
    const dados = Object.fromEntries(new FormData(form));
    try {
      const resp = await fetch("/api/apoio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      if (!resp.ok) throw new Error();
      setEnviado(true);
      form.reset();
    } catch {
      setErro("Não foi possível enviar agora. Tente de novo em instantes.");
    } finally {
      setEnviando(false);
    }
  }

  const campos = "rounded-xl border-2 border-tinta/15 px-4 py-3 font-normal focus:outline-none focus:border-laranja focus:ring-2 focus:ring-laranja/25";

  return (
    <section id="movimento" className="bg-laranja text-creme py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-5">
        <h2 className="titulo-impacto text-4xl sm:text-5xl md:text-6xl text-creme text-center">
          Essa luta começa em Mineiros.
          <br />E é <span className="text-amarelo">por Goiás inteiro.</span>
        </h2>
        <p className="mt-6 text-center text-creme/95 font-semibold text-lg sm:text-xl max-w-2xl mx-auto">
          Não é sobre um candidato. É sobre o interior voltar a ter saúde de
          verdade. Se você acredita nisso, seu lugar é aqui dentro.
        </p>

        {/* Botão gigante — azul para saltar sobre o laranja */}
        <div className="mt-10 text-center">
          <a
            href={hrefGrupo()}
            className="inline-flex items-center gap-3 rounded-full bg-azul hover:bg-azul-escuro text-creme titulo-impacto text-xl sm:text-2xl px-10 py-5 transition-colors shadow-xl shadow-black/20"
          >
            <IconeWhatsApp className="w-7 h-7" />
            {site.ctaGrupo}
          </a>
        </div>

        <div className="mt-16 grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
          {/* Formulário em card branco */}
          <div className="rounded-3xl bg-white text-tinta p-6 sm:p-8 shadow-2xl shadow-black/15">
            {enviado ? (
              <div className="text-center py-10">
                <p className="titulo-impacto text-2xl sm:text-3xl text-azul">
                  Recebido. <span className="text-laranja">Tô junto!</span>
                </p>
                <p className="mt-3 text-tinta/70 font-semibold">
                  A campanha vai falar com você pelo WhatsApp.
                </p>
              </div>
            ) : (
              <form onSubmit={aoEnviar} className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-bold text-azul">
                  Nome
                  <input name="nome" required autoComplete="name" className={campos} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-azul">
                  WhatsApp
                  <input
                    name="whatsapp"
                    required
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(64) 9 9999-9999"
                    className={campos}
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-azul">
                  Cidade
                  <input name="cidade" required autoComplete="address-level2" className={campos} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-azul">
                  Bairro
                  <input name="bairro" required className={campos} />
                </label>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full rounded-full bg-laranja hover:bg-laranja-escuro disabled:opacity-60 text-creme titulo-impacto text-lg sm:text-xl px-8 py-4 transition-colors shadow-lg shadow-laranja/30"
                  >
                    {enviando ? "Enviando..." : site.ctaJunto}
                  </button>
                  {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
                  <p className="mt-3 text-xs text-tinta/55 text-center font-semibold">
                    Autorizo o contato da campanha.
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Mini-adesivo + QR code */}
          <div className="mx-auto text-center space-y-6">
            {/* O adesivo da campanha, recriado em código */}
            <div className="w-52 h-52 mx-auto rounded-full bg-amarelo flex flex-col items-center justify-center rotate-3 shadow-xl shadow-black/20 select-none">
              <p className="titulo-impacto text-2xl leading-none">
                <span className="text-azul">Tô </span>
                <span className="text-laranja">junto</span>
                <br />
                <span className="text-azul">com</span>
              </p>
              <span className="placa mt-2 text-lg">Dr. Lourival</span>
              <p className="mt-2 text-[10px] font-extrabold tracking-wider text-laranja">
                {site.arroba.toUpperCase()}
              </p>
            </div>

            {/* QR — 🖼️🔍 gerar na finalização apontando pro Instagram */}
            <div>
              <div className="w-40 h-40 mx-auto rounded-2xl bg-white flex flex-col items-center justify-center gap-2 text-tinta/50 border-2 border-dashed border-tinta/20 p-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <path d="M14 14h3v3h-3zM19 19h2v2h-2zM14 19h2M19 14h2" />
                </svg>
                <span className="text-[10px] font-semibold">
                  🖼️ QR code (gerar na finalização)
                </span>
              </div>
              <p className="mt-3 text-sm text-creme font-semibold max-w-44 mx-auto">
                Acompanhe o Dr. de perto.{" "}
                <a
                  href={site.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-extrabold underline underline-offset-2"
                >
                  {site.arroba}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
