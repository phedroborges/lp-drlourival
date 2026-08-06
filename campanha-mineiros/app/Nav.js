"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const LINKS = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/equipe", label: "Pessoas", icon: "◉" },
  { href: "/orcamento", label: "Orçamento", icon: "R$" },
];

export default function Nav({ admin = false }) {
  const path = usePathname();
  const links = admin ? [...LINKS, { href: "/acessos", label: "Acessos", icon: "◈" }] : LINKS;
  return (
    <aside className="sidebar" aria-label="Navegação principal">
      <Link href="/" className="side-brand" aria-label="Dados da campanha — início">
        <Avatar className="brand-symbol"><AvatarFallback>L</AvatarFallback></Avatar>
        <span className="brand-copy"><strong>Dr. Lourival</strong><small>Dados da campanha</small></span>
      </Link>

      <div className="side-sec">Geral</div>
      {links.map((item) => {
        const active = item.href === "/" ? path === "/" || path.startsWith("/cidade/") : path.startsWith(item.href);
        return <Link key={item.href} href={item.href} className={`side-link${active ? " active" : ""}`}><span className="side-ico" aria-hidden="true">{item.icon}</span><span>{item.label}</span></Link>;
      })}

      <div className="side-sec">Ferramentas</div>
      <Tooltip>
        <TooltipTrigger render={<a className="side-link" href="/api/export" />}>
          <span className="side-ico" aria-hidden="true">↓</span><span>Exportar dados</span>
        </TooltipTrigger>
        <TooltipContent>Baixar backup completo em JSON</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<a className="side-link" href="https://tocomdrlourival.com" target="_blank" rel="noreferrer" />}>
          <span className="side-ico" aria-hidden="true">↗</span><span>Site público</span>
        </TooltipTrigger>
        <TooltipContent>Abrir o site público da campanha</TooltipContent>
      </Tooltip>

      <div className="side-spacer" />
      <div className="side-profile">
        <Avatar className="profile-avatar" size="sm"><AvatarFallback>DL</AvatarFallback></Avatar>
        <span><strong>Campanha ativa</strong><small>Goiás · 2026</small></span>
        <i />
      </div>
    </aside>
  );
}
