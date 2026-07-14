import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: `Política de privacidade | ${site.nome}`,
};

/**
 * Política de privacidade — versão inicial simples.
 * TODO: validar o texto final com a assessoria jurídica da campanha (LGPD).
 */
export default function Privacidade() {
  return (
    <main className="min-h-svh bg-creme text-tinta">
      <div className="mx-auto max-w-2xl px-5 py-16 space-y-6 leading-relaxed">
        <h1 className="titulo-impacto text-3xl text-azul">
          Política de privacidade
        </h1>
        <p>
          Este site coleta, com o seu consentimento, os dados informados no
          formulário de apoio: nome, WhatsApp, cidade e bairro.
        </p>
        <p>
          Esses dados são usados exclusivamente pela equipe da pré-campanha de{" "}
          {site.nome} para contato sobre o movimento, e não são vendidos nem
          compartilhados com terceiros.
        </p>
        <p>
          Para solicitar a remoção dos seus dados, fale com a equipe pelo
          Instagram{" "}
          <a
            href={site.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-laranja font-semibold hover:underline"
          >
            {site.arroba}
          </a>
          .
        </p>
        <p>
          <Link href="/" className="text-azul font-semibold hover:underline">
            ← Voltar para o site
          </Link>
        </p>
      </div>
    </main>
  );
}
