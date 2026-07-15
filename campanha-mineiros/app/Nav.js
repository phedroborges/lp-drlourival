"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Visão estadual", icon: "GO" },
  { href: "/equipe", label: "Equipe completa", icon: "EQ" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <aside className="sidebar" aria-label="Navegação principal">
      <Link href="/" className="side-brand" aria-label="Dados da campanha — início">
        <span className="brand-kicker">Dados da campanha</span>
        <span className="brand-placa">Dr. Lourival</span>
        <span className="brand-sub">Organização territorial de Goiás</span>
      </Link>

      <div className="side-sec">Operação</div>
      {LINKS.map((l) => {
        const active = l.href === "/" ? path === "/" || path.startsWith("/cidade/") : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={`side-link${active ? " active" : ""}`}>
            <span className="side-ico" aria-hidden="true">{l.icon}</span>
            <span>{l.label}</span>
          </Link>
        );
      })}

      <div className="side-sec">Dados</div>
      <a className="side-link" href="/api/export" title="Baixar backup completo em JSON">
        <span className="side-ico" aria-hidden="true">BK</span>
        <span>Exportar backup</span>
      </a>

      <div className="side-spacer" />
      <div className="side-foot">
        <a href="https://tocomdrlourival.com" target="_blank" rel="noreferrer">Abrir site público ↗</a>
        <p>Acesso direto, sem login</p>
      </div>
    </aside>
  );
}
