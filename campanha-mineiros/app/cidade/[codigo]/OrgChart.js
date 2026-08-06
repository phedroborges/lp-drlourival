"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditableText } from "@/components/ui/editable-field";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TemperaturePicker from "@/app/ui/TemperaturePicker";

function CardMenu({ person, onEdit, onDelete }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <div className="card-edit">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label={`Mais ações para ${person.nome}`}>
              <MoreHorizontal className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(person)}>Editar detalhes completos</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Excluir ${person.nome}?`}
        description="Remove essa pessoa e os vínculos com territórios."
        onConfirm={() => onDelete(person)}
      />
    </div>
  );
}

function LeaderCard({ leader, cabos, onEdit, onQuickUpdate, onDelete }) {
  const leaderCabos = cabos.filter((cabo) => cabo.lider_id === leader.id);
  return (
    <article className="org-leader-card">
      <CardMenu person={leader} onEdit={onEdit} onDelete={onDelete} />
      <InitialsAvatar name={leader.nome} />
      <div className="person-copy">
        <EditableText
          value={leader.nome}
          onSave={(value) => value && onQuickUpdate(leader, { nome: value })}
          className="block font-semibold"
        />
        <EditableText
          value={leader.cargo || ""}
          placeholder="Liderança territorial"
          onSave={(value) => onQuickUpdate(leader, { cargo: value })}
          className="block text-xs text-muted-foreground"
        />
        <TemperaturePicker
          value={leader.classificacao || ""}
          onSave={(value) => onQuickUpdate(leader, { classificacao: value })}
        />
      </div>
      <div className="org-foot"><span>{leaderCabos.length} cabos</span></div>
      {leaderCabos.length ? (
        <div className="territory-chips">
          {leaderCabos.slice(0, 4).map((cabo) => <span key={cabo.id}>{cabo.nome}</span>)}
          {leaderCabos.length > 4 ? <span>+{leaderCabos.length - 4}</span> : null}
        </div>
      ) : (
        <p className="attention-note">Vincule cabos eleitorais a esta liderança.</p>
      )}
    </article>
  );
}

function LeaderStack({ leaders, cabos, onEdit, onQuickUpdate, onDelete }) {
  const visible = leaders.slice(0, 4);
  const remaining = leaders.slice(4);

  return (
    <div className="leader-stack">
      {visible.map((leader) => (
        <LeaderCard
          key={leader.id}
          leader={leader}
          cabos={cabos}
          onEdit={onEdit}
          onQuickUpdate={onQuickUpdate}
          onDelete={onDelete}
        />
      ))}
      {remaining.length ? (
        <Accordion className="org-more">
          <AccordionItem value="mais">
            <AccordionTrigger>Ver mais {remaining.length} lideranças</AccordionTrigger>
            <AccordionContent>
              <div className="leader-stack org-more-list">
                {remaining.map((leader) => (
                  <LeaderCard
                    key={leader.id}
                    leader={leader}
                              cabos={cabos}
                    onEdit={onEdit}
                    onQuickUpdate={onQuickUpdate}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}
    </div>
  );
}

function ChefeBranch({ chefe, leaders, cabos, onEdit, onAdd, onQuickUpdate, onDelete }) {
  const team = leaders.filter((leader) => leader.responsavel_id === chefe.id);
  const totalCabos = team.reduce((sum, leader) => sum + cabos.filter((cabo) => cabo.lider_id === leader.id).length, 0);
  return (
    <section className="chefe-branch">
      <article className="coord-card chefe-card">
        <CardMenu person={chefe} onEdit={onEdit} onDelete={onDelete} />
        <span className="role-label">Chefe de gabinete</span>
        <InitialsAvatar name={chefe.nome} className="mx-auto" />
        <EditableText
          value={chefe.nome}
          onSave={(value) => value && onQuickUpdate(chefe, { nome: value })}
          className="mx-auto block w-fit font-semibold"
        />
        <EditableText
          value={chefe.cargo || ""}
          placeholder="Chefia de gabinete"
          onSave={(value) => onQuickUpdate(chefe, { cargo: value })}
          className="mx-auto block w-fit text-xs text-muted-foreground"
        />
        <TemperaturePicker
          value={chefe.classificacao || ""}
          onSave={(value) => onQuickUpdate(chefe, { classificacao: value })}
        />
        <div className="coord-summary">
          <span>{team.length} lideranças</span>
          <span>{totalCabos} cabos</span>
        </div>
      </article>
      <div className="branch-line" />
      {team.length ? (
        <LeaderStack
          leaders={team}
          cabos={cabos}
          onEdit={onEdit}
          onQuickUpdate={onQuickUpdate}
          onDelete={onDelete}
        />
      ) : (
        <button className="empty-branch" onClick={() => onAdd({ nivel: "lideranca", responsavel_id: chefe.id })}>
          + Adicionar liderança neste gabinete
        </button>
      )}
    </section>
  );
}

function CoordinatorCard({ coordinator, onEdit, onQuickUpdate, onDelete }) {
  return (
    <article className="coord-card">
      <CardMenu person={coordinator} onEdit={onEdit} onDelete={onDelete} />
      <InitialsAvatar name={coordinator.nome} size="lg" className="light mx-auto" />
      <EditableText
        value={coordinator.nome}
        onSave={(value) => value && onQuickUpdate(coordinator, { nome: value })}
        className="mx-auto block w-fit font-semibold"
      />
      <EditableText
        value={coordinator.cargo || ""}
        placeholder="Coordenação geral da campanha"
        onSave={(value) => onQuickUpdate(coordinator, { cargo: value })}
        className="mx-auto block w-fit text-xs text-muted-foreground"
      />
      <span className="coord-global-note">Mesma coordenação em todas as cidades</span>
    </article>
  );
}

export default function OrgChart({ cidade, onEdit, onAdd, onQuickUpdate, onDelete }) {
  const cabos = cidade.cabos || [];
  const coordinators = cidade.lideres.filter((item) => item.nivel === "coordenacao");
  const chefes = cidade.lideres.filter((item) => item.nivel === "chefe_gabinete");
  const leaders = cidade.lideres.filter((item) => item.nivel === "lideranca");
  const chefeIds = new Set(chefes.map((item) => item.id));
  const direct = leaders.filter((item) => !item.responsavel_id || !chefeIds.has(item.responsavel_id));

  if (!cidade.lideres.length) {
    return (
      <div className="empty-state">
        <span>◎</span>
        <h3>A estrutura começa pela coordenação</h3>
        <p>Adicione a primeira pessoa e escolha o papel dela. O organograma será montado automaticamente.</p>
        <Button onClick={() => onAdd()}>Adicionar primeira pessoa</Button>
      </div>
    );
  }

  return (
    <div className="org-chart">
      <div className="org-root">
        <span>Coordenação geral · estrutura local</span>
        <strong>{cidade.nome}</strong>
        <small>
          {coordinators.length} na coordenação da campanha · {chefes.length} chefes de gabinete ·{" "}
          {leaders.length} lideranças locais · {cabos.length} cabos
        </small>
      </div>
      <div className="org-trunk" />
      <section className="coord-collective">
        <div className="coord-collective-head">
          <span className="role-label">Coordenação de toda a campanha</span>
          <p>Comanda toda a estrutura de {cidade.nome} em conjunto — sem hierarquia entre eles.</p>
        </div>
        <div className="coord-collective-grid">
          {coordinators.length ? (
            coordinators.map((coordinator) => (
              <CoordinatorCard
                key={coordinator.id}
                coordinator={coordinator}
                onEdit={onEdit}
                onQuickUpdate={onQuickUpdate}
                onDelete={onDelete}
              />
            ))
          ) : (
            <button className="empty-branch" onClick={() => onAdd({ nivel: "coordenacao" })}>
              + Adicionar coordenação
            </button>
          )}
        </div>
      </section>
      <div className="branch-line" />
      {chefes.length ? (
        <div className="chefe-grid">
          {chefes.map((chefe) => (
            <ChefeBranch
              key={chefe.id}
              chefe={chefe}
              leaders={leaders}
                  cabos={cabos}
              onEdit={onEdit}
              onAdd={onAdd}
              onQuickUpdate={onQuickUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : null}
      {direct.length ? (
        <section className="coord-branch direct-branch">
          <article className="coord-card neutral-card">
            <span className="role-label">Ligação direta com a coordenação</span>
            <h3>Equipe de {cidade.nome}</h3>
            <p>Lideranças ainda sem chefe de gabinete definido</p>
            <div className="coord-summary"><span>{direct.length} líderes</span></div>
          </article>
          <div className="branch-line" />
          <LeaderStack
            leaders={direct}
              cabos={cabos}
            onEdit={onEdit}
            onQuickUpdate={onQuickUpdate}
            onDelete={onDelete}
          />
        </section>
      ) : null}
      {!chefes.length && !direct.length ? (
        <button className="empty-branch" onClick={() => onAdd({ nivel: "chefe_gabinete" })}>
          + Adicionar chefe de gabinete ou liderança
        </button>
      ) : null}
    </div>
  );
}
