"use client";
import { usePathname } from "next/navigation";
import Nav from "./Nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Telas que aparecem sem a moldura do painel: o plano de campo, que a equipe
// de rua abre por link, e o login.
const SEM_MOLDURA = [/^\/campo\//, /^\/login$/];

export default function AppFrame({ children, email, admin = false }) {
  const pathname = usePathname();
  if (SEM_MOLDURA.some((padrao) => padrao.test(pathname))) return children;

  const iniciais = (email || "DL").slice(0, 2).toUpperCase();
  return (
    <div className="app">
      <Nav admin={admin} />
      <div className="workspace-shell">
        <header className="app-topbar">
          <div><span className="topbar-dot" /><strong>Central de dados</strong></div>
          <div className="topbar-actions">
            {email ? <span className="topbar-user">{email}</span> : null}
            <form action="/auth/signout" method="post">
              <button type="submit" className="ghost topbar-sair">Sair</button>
            </form>
            <Avatar className="topbar-avatar" size="sm"><AvatarFallback>{iniciais}</AvatarFallback></Avatar>
          </div>
        </header>
        <div className="main">{children}</div>
      </div>
    </div>
  );
}
