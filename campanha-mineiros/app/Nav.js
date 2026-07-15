"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/equipe", label: "Pessoas", icon: "◉" },
  { href: "/orcamento", label: "Orçamento", icon: "R$" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <aside className="sidebar" aria-label="Navegação principal">
      <Link href="/" className="side-brand" aria-label="Dados da campanha — início">
        <span className="brand-symbol">L</span>
        <span className="brand-copy"><strong>Dr. Lourival</strong><small>Dados da campanha</small></span>
      </Link>

      <div className="side-sec">Geral</div>
      {LINKS.map((item) => {
        const active = item.href === "/" ? path === "/" || path.startsWith("/cidade/") : path.startsWith(item.href);
        return <Link key={item.href} href={item.href} className={`side-link${active ? " active" : ""}`}><span className="side-ico" aria-hidden="true">{item.icon}</span><span>{item.label}</span></Link>;
      })}

      <div className="side-sec">Ferramentas</div>
      <a className="side-link" href="/api/export" title="Baixar backup completo em JSON"><span className="side-ico" aria-hidden="true">↓</span><span>Exportar dados</span></a>
      <a className="side-link" href="https://tocomdrlourival.com" target="_blank" rel="noreferrer"><span className="side-ico" aria-hidden="true">↗</span><span>Site público</span></a>

      <div className="side-spacer" />
      <div className="side-profile">
        <span className="profile-avatar">DL</span>
        <span><strong>Campanha ativa</strong><small>Goiás · 2026</small></span>
        <i />
      </div>
    </aside>
  );
}
