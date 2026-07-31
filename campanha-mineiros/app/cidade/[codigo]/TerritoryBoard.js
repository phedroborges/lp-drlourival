"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import TemperatureBadge from "@/app/ui/TemperatureBadge";

function TerritoryCard({ bairro, cidade, onCabo, onAssign, onUnassign, onDelete }) {
  const [open, setOpen] = useState(bairro.lideres.length > 0 || bairro.cabos.length > 0);
  const [pickValue, setPickValue] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const available = cidade.lideres.filter((leader) => leader.nivel !== "coordenacao" && !bairro.lideres.some((item) => item.id === leader.id));
  const status = bairro.lideres.length && bairro.cabos.length ? "structured" : bairro.lideres.length || bairro.cabos.length ? "forming" : "empty";

  // Reseta o seletor depois que a atribuição recarrega os dados (evita resetar o valor
  // controlado no mesmo tick do onValueChange, que confunde o estado interno do Select).
  useEffect(() => {
    setPickValue("");
  }, [bairro.lideres.length]);
  return (
    <article className={`territory-card ${status}`}>
      <button className="territory-summary" type="button" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="territory-pulse" />
        <span><strong>{bairro.nome}</strong><small>{bairro.lideres.length} lideranças · {bairro.cabos.length} cabos</small></span>
        <span className="coverage-label">{status === "structured" ? "Ativo" : status === "forming" ? "Em formação" : "Sem equipe"}</span>
        <span className="chevron">⌄</span>
      </button>
      {open ? (
        <div className="territory-body">
          <section>
            <div className="mini-heading">
              <span>Lideranças do território</span>
              <Select
                value={pickValue}
                onValueChange={(value) => {
                  // base-ui dispara onValueChange(null) quando o valor controlado deixa de
                  // corresponder a um item da lista (acontece aqui assim que a liderança
                  // escolhida some de "available" após a atribuição recarregar os dados).
                  if (!value) return;
                  setPickValue(value);
                  onAssign(Number(value), bairro.id);
                }}
              >
                <SelectTrigger size="sm"><SelectValue placeholder="+ Vincular liderança" /></SelectTrigger>
                <SelectContent>
                  {available.map((leader) => <SelectItem key={leader.id} value={String(leader.id)}>{leader.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {bairro.lideres.length ? (
              <div className="linked-people">
                {bairro.lideres.map((leader) => (
                  <div key={leader.id}>
                    <InitialsAvatar name={leader.nome} size="sm" />
                    <span><strong>{leader.nome}</strong><small>{leader.cargo || "Liderança"}</small></span>
                    <TemperatureBadge value={leader.classificacao} />
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button variant="ghost" size="icon-xs" onClick={() => onUnassign(leader.id, bairro.id)} aria-label={`Desvincular ${leader.nome}`} />
                        }
                      >
                        <X className="size-3" />
                      </TooltipTrigger>
                      <TooltipContent>Desvincular</TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </div>
            ) : (
              <p className="quiet-empty">Nenhuma liderança vinculada.</p>
            )}
          </section>
          <section>
            <div className="mini-heading">
              <span>Cabos eleitorais</span>
              <button className="text-button" onClick={() => onCabo(null, bairro)}>+ Adicionar cabo</button>
            </div>
            {bairro.cabos.length ? (
              <div className="cabo-list">
                {bairro.cabos.map((cabo) => {
                  const leader = bairro.lideres.find((item) => item.id === cabo.lider_id);
                  return (
                    <button key={cabo.id} onClick={() => onCabo(cabo, bairro)}>
                      <InitialsAvatar name={cabo.nome} size="sm" />
                      <span>
                        <strong>{cabo.nome}</strong>
                        <small>{leader ? `Com ${leader.nome}` : "Sem liderança responsável"}{cabo.contato ? ` · ${cabo.contato}` : ""}</small>
                      </span>
                      <span>Editar</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="quiet-empty">Ainda não há cabos neste território.</p>
            )}
          </section>
          <footer>
            <Button variant="link" className="danger-link h-auto p-0 text-destructive" onClick={() => setConfirmOpen(true)}>
              Excluir território
            </Button>
          </footer>
        </div>
      ) : null}
      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Excluir ${bairro.nome}?`}
        description="Remove o território e os cabos vinculados a ele."
        onConfirm={() => onDelete(bairro)}
      />
    </article>
  );
}

export default function TerritoryBoard({ cidade, onAddBairro, onDeleteBairro, onCabo, onAssign, onUnassign }) {
  const [name, setName] = useState("");
  const bairros = cidade.grupos.flatMap((group) => group.bairros);
  const active = bairros.filter((bairro) => bairro.lideres.length || bairro.cabos.length).length;
  return (
    <div className="territory-board">
      <div className="section-toolbar">
        <div>
          <h2>Territórios de {cidade.nome}</h2>
          <p>{active} de {bairros.length} bairros/setores já possuem equipe.</p>
        </div>
        <form
          className="inline-create"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) {
              onAddBairro(name);
              setName("");
            }
          }}
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Novo bairro ou setor" />
          <Button type="submit">+ Criar território</Button>
        </form>
      </div>
      {cidade.grupos.map((group) => (
        <section className="territory-group" key={group.grupo}>
          <h3>{group.grupo}<span>{group.bairros.length}</span></h3>
          <div>
            {group.bairros.map((bairro) => (
              <TerritoryCard
                key={bairro.id}
                bairro={bairro}
                cidade={cidade}
                onCabo={onCabo}
                onAssign={onAssign}
                onUnassign={onUnassign}
                onDelete={onDeleteBairro}
              />
            ))}
          </div>
        </section>
      ))}
      {!bairros.length ? (
        <div className="empty-state">
          <span>⌖</span>
          <h3>Crie o primeiro território</h3>
          <p>Cadastre bairros ou setores para distribuir lideranças e cabos.</p>
        </div>
      ) : null}
    </div>
  );
}
