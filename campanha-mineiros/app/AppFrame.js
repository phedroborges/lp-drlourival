"use client";
import { usePathname } from "next/navigation";
import Nav from "./Nav";

export default function AppFrame({ children }) {
  const pathname = usePathname();
  if (pathname.startsWith("/campo/")) return children;
  return (
    <div className="app">
      <Nav />
      <div className="workspace-shell">
        <header className="app-topbar"><div><span className="topbar-dot" /><strong>Central de dados</strong></div><div className="topbar-actions"><span>Atualização em tempo real</span><span className="topbar-avatar">DL</span></div></header>
        <div className="main">{children}</div>
      </div>
    </div>
  );
}
