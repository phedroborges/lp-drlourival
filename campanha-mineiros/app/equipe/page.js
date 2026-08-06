"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import PersonCard from "@/app/ui/PersonCard";

const PREVIEW_COUNT = 4;

async function request(url, method, body) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Não foi possível concluir a ação.");
  return result;
}

function CaboRow({ cabo }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <InitialsAvatar name={cabo.nome} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{cabo.nome}</p>
          <p className="truncate text-xs text-muted-foreground">{cabo.contato || "Sem contato"}</p>
        </div>
      </div>
      <dl>
        <dt>Cidade</dt><dd><Link href={`/cidade/${cabo.municipio_codigo}`}>{cabo.municipio_nome}</Link></dd>
        <dt>Líder</dt><dd>{cabo.lider_nome || "Sem líder"}</dd>
      </dl>
    </Card>
  );
}

function PersonGroup({ title, items, chefesPorCidade, onQuickUpdate, onEdit, onDelete }) {
  const preview = items.slice(0, PREVIEW_COUNT);
  return (
    <section className="section">
      <h2>{title} <span className="badge-count">{items.length}</span></h2>
      {items.length === 0 ? (
        <div className="empty">Nada por aqui ainda.</div>
      ) : (
        <>
          <div className="people-grid">
            {preview.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                chefes={chefesPorCidade(person.municipio_codigo)}
                onQuickUpdate={onQuickUpdate}
                onEdit={onEdit}
                onDelete={onDelete}
                footer={<><dt>Cidade</dt><dd>{person.municipio_nome}</dd></>}
              />
            ))}
          </div>
          {items.length > PREVIEW_COUNT ? (
            <Drawer swipeDirection="right">
              <DrawerTrigger render={<Button variant="outline" className="mt-3" />}>Ver todos ({items.length})</DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>{title}</DrawerTitle>
                  <DrawerDescription>{items.length} pessoas</DrawerDescription>
                </DrawerHeader>
                <div className="people-grid overflow-y-auto px-4 pb-4">
                  {items.map((person) => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      chefes={chefesPorCidade(person.municipio_codigo)}
                      onQuickUpdate={onQuickUpdate}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      footer={<><dt>Cidade</dt><dd>{person.municipio_nome}</dd></>}
                    />
                  ))}
                </div>
              </DrawerContent>
            </Drawer>
          ) : null}
        </>
      )}
    </section>
  );
}

export default function EquipePage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");

  async function reload() {
    const response = await fetch("/api/equipe", { cache: "no-store" });
    setData(await response.json());
  }
  useEffect(() => { reload(); }, []);

  async function quickUpdatePerson(person, patch) {
    await request("/api/lideres", "PATCH", { id: person.id, ...patch });
    await reload();
  }
  async function deletePerson(person) {
    await request("/api/lideres", "DELETE", { id: person.id });
    await reload();
  }
  function editPerson(person) {
    router.push(`/cidade/${person.municipio_codigo}`);
  }

  const query = q.trim().toLowerCase();
  const { coordenacao, chefes, lideres, apoiadores, cabos } = useMemo(() => {
    if (!data) return { coordenacao: [], chefes: [], lideres: [], apoiadores: [], cabos: [] };
    const f = (s) => !query || (s || "").toLowerCase().includes(query);
    const pessoas = data.lideres.filter((l) => f(l.nome) || f(l.municipio_nome) || f(l.cargo));
    return {
      coordenacao: pessoas.filter((person) => person.nivel === "coordenacao"),
      chefes: pessoas.filter((person) => person.nivel === "chefe_gabinete"),
      lideres: pessoas.filter((person) => person.nivel === "lideranca"),
      apoiadores: pessoas.filter((person) => person.nivel === "apoiador"),
      cabos: data.cabos.filter((c) => f(c.nome) || f(c.municipio_nome) || f(c.lider_nome)),
    };
  }, [data, query]);

  function chefesPorCidade(codigo) {
    return chefes.filter((c) => c.municipio_codigo === codigo);
  }

  if (!data) return <main className="wrap"><p className="hint">Carregando…</p></main>;

  return (
    <main className="wrap">
      <div className="eyebrow">Visão geral</div>
      <h1>Equipe da campanha</h1>
      <p className="subtitle">Uma coordenação geral para toda a campanha, com lideranças e cabos organizados por município. Clique em cima do nome, cargo ou das etiquetas pra editar na hora.</p>

      <div className="stats">
        <div className="stat"><div className="num">{data.lideres.filter((person) => person.nivel === "coordenacao").length}</div><div className="lbl">Coordenação geral</div></div>
        <div className="stat"><div className="num">{data.lideres.filter((person) => person.nivel === "chefe_gabinete").length}</div><div className="lbl">Chefes de gabinete</div></div>
        <div className="stat"><div className="num">{data.lideres.filter((person) => person.nivel === "lideranca").length}</div><div className="lbl">Lideranças</div></div>
        <div className="stat"><div className="num">{data.lideres.filter((person) => person.nivel === "apoiador").length}</div><div className="lbl">Apoiadores</div></div>
        <div className="stat"><div className="num">{data.cabos.length}</div><div className="lbl">Cabos eleitorais</div></div>
      </div>

      <div className="toolbar">
        <Input type="text" placeholder="Buscar por nome, município, liderança…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <PersonGroup title="Coordenação da campanha" items={coordenacao} chefesPorCidade={chefesPorCidade} onQuickUpdate={quickUpdatePerson} onEdit={editPerson} onDelete={deletePerson} />
      <PersonGroup title="Chefes de gabinete" items={chefes} chefesPorCidade={chefesPorCidade} onQuickUpdate={quickUpdatePerson} onEdit={editPerson} onDelete={deletePerson} />
      <PersonGroup title="Lideranças" items={lideres} chefesPorCidade={chefesPorCidade} onQuickUpdate={quickUpdatePerson} onEdit={editPerson} onDelete={deletePerson} />
      <PersonGroup title="Apoiadores" items={apoiadores} chefesPorCidade={chefesPorCidade} onQuickUpdate={quickUpdatePerson} onEdit={editPerson} onDelete={deletePerson} />

      <section className="section">
        <h2>Cabos eleitorais <span className="badge-count">{cabos.length}</span></h2>
        {cabos.length === 0 ? (
          <div className="empty">Nenhum cabo eleitoral ainda.</div>
        ) : (
          <>
            <div className="people-grid">
              {cabos.slice(0, PREVIEW_COUNT).map((c) => <CaboRow key={c.id} cabo={c} />)}
            </div>
            {cabos.length > PREVIEW_COUNT ? (
              <Drawer swipeDirection="right">
                <DrawerTrigger render={<Button variant="outline" className="mt-3" />}>Ver todos ({cabos.length})</DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Cabos eleitorais</DrawerTitle>
                    <DrawerDescription>{cabos.length} cabos</DrawerDescription>
                  </DrawerHeader>
                  <div className="people-grid overflow-y-auto px-4 pb-4">
                    {cabos.map((c) => <CaboRow key={c.id} cabo={c} />)}
                  </div>
                </DrawerContent>
              </Drawer>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
