"use client";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import OrgChart from "./OrgChart";
import PeopleView from "./PeopleView";
import RoutePlanner from "./RoutePlanner";
import PersonModal from "./PersonModal";
import CaboModal from "./CaboModal";
import OperationBoard from "./OperationBoard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const TABS = [
  { id: "visao", label: "Visão geral" },
  { id: "operacao", label: "Operação" },
  { id: "pessoas", label: "Pessoas" },
  { id: "rotas", label: "Rotas no mapa" },
];

async function request(url, method, body) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Não foi possível concluir a ação.");
  return result;
}

export default function CidadePage({ params }) {
  const { codigo } = use(params);
  const code = Number(codigo);
  const [cidade, setCidade] = useState(null);
  const [tab, setTab] = useState("visao");
  const [personModal, setPersonModal] = useState(null);
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [caboModal, setCaboModal] = useState(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const response = await fetch(`/api/cidade?codigo=${code}`, { cache: "no-store" });
    setCidade(await response.json());
  }, [code]);
  useEffect(() => { reload(); }, [reload]);

  const cabosDaCidade = useMemo(() => cidade?.cabos || [], [cidade]);
  if (!cidade) {
    return (
      <main className="command-page city-command">
        <div className="city-scoreboard">
          {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-[94px] rounded-2xl" />)}
        </div>
        <Skeleton className="mt-4 h-10 w-full max-w-md rounded-full" />
        <Skeleton className="mt-4 h-64 w-full rounded-2xl" />
      </main>
    );
  }
  if (cidade.error) return <main className="command-page"><div className="empty-state"><h2>Município não encontrado</h2><Link href="/">Voltar para Goiás</Link></div></main>;

  const coordinators = cidade.lideres.filter((person) => person.nivel === "coordenacao").length;
  const chefes = cidade.lideres.filter((person) => person.nivel === "chefe_gabinete").length;
  const leaders = cidade.lideres.filter((person) => person.nivel === "lideranca").length;
  const supporters = cidade.lideres.filter((person) => person.nivel === "apoiador").length;
  const cabos = cabosDaCidade.length;
  const cabosSemLideranca = cabosDaCidade.filter((cabo) => !cabo.lider_id).length;

  async function run(action) {
    try { setError(""); await action(); await reload(); }
    catch (err) { setError(err.message); }
  }
  function openPerson(person = null) {
    setPersonModal(typeof person === "number" ? { nivel: "lideranca", responsavel_id: person } : person);
    setPersonModalOpen(true);
  }
  async function savePerson(form) {
    const editing = Boolean(personModal?.id);
    await run(() => request("/api/lideres", editing ? "PATCH" : "POST", editing ? { id: personModal.id, municipio_codigo: code, ...form } : { municipio_codigo: code, ...form }));
    setPersonModalOpen(false);
  }
  async function deletePerson(person) {
    await run(() => request("/api/lideres", "DELETE", { id: person.id }));
    setPersonModalOpen(false);
  }
  async function quickUpdatePerson(person, patch) {
    await run(() => request("/api/lideres", "PATCH", { id: person.id, ...patch }));
  }
  async function saveCabo(form) {
    await run(() => request("/api/cabos", caboModal?.cabo ? "PATCH" : "POST", caboModal?.cabo ? { id: caboModal.cabo.id, ...form } : { municipio_codigo: code, ...form }));
    setCaboModal(null);
  }
  async function deleteCabo(cabo) {
    await run(() => request("/api/cabos", "DELETE", { id: cabo.id }));
    setCaboModal(null);
  }

  return (
    <main className="command-page city-command">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink render={<Link href="/" />}>Goiás</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{cidade.nome}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <header className="city-hero">
        <div><span className="eyebrow">{cidade.sudoeste ? "Prioridade · Sudoeste Goiano" : "Operação municipal"}</span><h1>{cidade.nome}</h1><p>Coordenação geral da campanha, com lideranças, cabos e rotas próprios da cidade.</p></div>
        <Button size="lg" onClick={() => openPerson()}>+ Adicionar pessoa</Button>
      </header>
      <section className="city-scoreboard">
        <article><span>Coordenação geral</span><strong>{coordinators}</strong><small>{coordinators ? "a mesma em toda a campanha" : "precisa de responsável"}</small></article>
        <article><span>Chefes de gabinete</span><strong>{chefes}</strong><small>na cidade</small></article>
        <article><span>Lideranças</span><strong>{leaders}</strong><small>na estrutura</small></article>
        <article><span>Apoiadores</span><strong>{supporters}</strong><small>de apoio</small></article>
        <article><span>Cabos eleitorais</span><strong>{cabos}</strong><small>em campo</small></article>
        <article><span>Sem liderança</span><strong>{cabosSemLideranca}</strong><small>cabos a vincular</small></article>
      </section>
      <Tabs value={tab} onValueChange={setTab} className="city-tabs-shell">
        <TabsList aria-label="Seções da cidade" className="city-tabs">
          {TABS.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
              {item.id === "operacao" ? <span>{cidade.tarefas?.length || 0}</span> : item.id === "pessoas" ? <span>{cidade.lideres.length + cabos}</span> : item.id === "rotas" ? <span>{cidade.rotas.length}</span> : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {error ? <div className="error-banner">{error}<button onClick={() => setError("")}>×</button></div> : null}
      <section className="city-content">
        {tab === "visao" ? <><div className="section-toolbar"><div><span className="eyebrow">Organograma territorial</span><h2>Quem coordena quem — e onde</h2><p>A estrutura é montada pelos vínculos cadastrados, sem duplicar informações na tela.</p></div><Button variant="outline" onClick={() => setTab("pessoas")}>Gerenciar pessoas</Button></div><OrgChart cidade={cidade} onEdit={openPerson} onAdd={openPerson} onQuickUpdate={quickUpdatePerson} onDelete={deletePerson} /></> : null}
        {tab === "operacao" ? <OperationBoard cidade={cidade} onChanged={reload} onOpenRoutes={() => setTab("rotas")} /> : null}
        {tab === "pessoas" ? <PeopleView cidade={cidade} onEdit={openPerson} onAdd={openPerson} onQuickUpdate={quickUpdatePerson} onDelete={deletePerson} onCabo={(cabo) => setCaboModal({ cabo })} /> : null}
        {tab === "rotas" ? <RoutePlanner cidade={cidade} onChanged={reload} /> : null}
      </section>
      {personModalOpen ? <PersonModal person={personModal} cidade={cidade} onClose={() => setPersonModalOpen(false)} onSave={savePerson} onDelete={deletePerson} /> : null}
      {caboModal ? <CaboModal cabo={caboModal.cabo} cidade={cidade} onClose={() => setCaboModal(null)} onSave={saveCabo} onDelete={deleteCabo} /> : null}
    </main>
  );
}
