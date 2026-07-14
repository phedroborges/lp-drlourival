import Link from "next/link";
import { site } from "@/config/site";
import { Batimento } from "@/components/ui/Batimento";

/** Rodapé — fundo azul royal. Sempre "pré-candidato", nunca número/"vote". */
export function Footer() {
  return (
    <footer className="bg-azul text-creme">
      <Batimento
        className="w-full h-8 opacity-50"
        cor="var(--amarelo)"
        animar={false}
      />
      <div className="mx-auto max-w-5xl px-5 py-10 text-center space-y-3">
        <p className="titulo-impacto text-lg">
          {site.nome} <span className="text-amarelo">•</span> {site.partido}{" "}
          <span className="text-amarelo">•</span> {site.cidade}, {site.estado}
        </p>
        <p className="text-sm text-creme/70 font-semibold">{site.titulo}</p>
        <p className="text-sm">
          <a
            href={site.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-extrabold text-amarelo hover:underline underline-offset-2"
          >
            {site.arroba}
          </a>
          <span className="mx-2 text-creme/40">•</span>
          <Link
            href="/privacidade"
            className="text-creme/70 hover:text-creme hover:underline underline-offset-2"
          >
            Política de privacidade
          </Link>
        </p>
      </div>
    </footer>
  );
}
