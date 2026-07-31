"use client";
import { usePathname } from "next/navigation";
import Nav from "./Nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AppFrame({ children }) {
  const pathname = usePathname();
  if (pathname.startsWith("/campo/")) return children;
  return (
    <div className="app">
      <Nav />
      <div className="workspace-shell">
        <header className="app-topbar"><div><span className="topbar-dot" /><strong>Central de dados</strong></div><div className="topbar-actions"><span>Atualização em tempo real</span><Avatar className="topbar-avatar" size="sm"><AvatarFallback>DL</AvatarFallback></Avatar></div></header>
        <div className="main">{children}</div>
      </div>
    </div>
  );
}
