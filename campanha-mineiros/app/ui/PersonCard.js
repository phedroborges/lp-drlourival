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
import { EditableText, EditableSelect } from "@/components/ui/editable-field";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import TemperatureToggle from "@/app/ui/TemperatureToggle";

const NIVEL_OPTIONS = [
  { value: "coordenacao", label: "Coordenação" },
  { value: "chefe_gabinete", label: "Chefe de gabinete" },
  { value: "lideranca", label: "Liderança" },
  { value: "apoiador", label: "Apoiador" },
];

export function cargoPadrao(nivel) {
  if (nivel === "coordenacao") return "Coordenação da campanha";
  if (nivel === "chefe_gabinete") return "Chefe de gabinete";
  if (nivel === "apoiador") return "Apoiador";
  return "Liderança";
}

/**
 * Card de pessoa com edição inline (clique no texto/tag edita na hora).
 * Reusado pela aba Pessoas da cidade e por /equipe.
 */
export default function PersonCard({ person, chefes = [], onQuickUpdate, onEdit, onDelete, footer }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const superior = chefes.find((item) => item.id === person.responsavel_id);
  const responsavelOptions = [
    { value: "", label: "Direto da coordenação" },
    ...chefes.map((item) => ({ value: String(item.id), label: item.nome })),
  ];

  return (
    <article className="person-card">
      <div className="person-card-head">
        <InitialsAvatar name={person.nome} />
        <div className="min-w-0 flex-1">
          <EditableText
            value={person.nome}
            onSave={(value) => value && onQuickUpdate(person, { nome: value })}
            className="block font-semibold text-[0.95rem]"
          />
          <EditableText
            value={person.cargo || ""}
            placeholder={cargoPadrao(person.nivel)}
            onSave={(value) => onQuickUpdate(person, { cargo: value })}
            className="block text-xs text-muted-foreground"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Mais ações">
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
      </div>

      <div className="quick-tags">
        <EditableSelect
          value={person.nivel}
          options={NIVEL_OPTIONS}
          onSave={(value) =>
            onQuickUpdate(
              person,
              value === "lideranca" ? { nivel: value } : { nivel: value, responsavel_id: null }
            )
          }
        />
        {person.nivel === "lideranca" ? (
          <EditableSelect
            value={person.responsavel_id ? String(person.responsavel_id) : ""}
            options={responsavelOptions}
            onSave={(value) => onQuickUpdate(person, { responsavel_id: value ? Number(value) : null })}
          />
        ) : null}
        {person.nivel !== "coordenacao" ? (
          <TemperatureToggle
            value={person.classificacao || ""}
            onSave={(value) => onQuickUpdate(person, { classificacao: value })}
          />
        ) : null}
      </div>

      <dl>
        <dt>Contato</dt>
        <dd>
          <EditableText
            value={person.contato || ""}
            placeholder="Adicionar telefone"
            type="tel"
            onSave={(value) => onQuickUpdate(person, { contato: value })}
          />
        </dd>
        {superior ? (
          <>
            <dt>Reporta a</dt>
            <dd>{superior.nome}</dd>
          </>
        ) : null}
        {person.nivel !== "coordenacao" ? (
          <>
            <dt>Territórios</dt>
            <dd>{person.bairro_ids?.length || 0} vinculados</dd>
          </>
        ) : null}
        {person.observacao ? (
          <>
            <dt>Próxima ação</dt>
            <dd>{person.observacao}</dd>
          </>
        ) : null}
        {footer}
      </dl>

      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Excluir ${person.nome}?`}
        description="Remove essa pessoa e os vínculos com territórios."
        onConfirm={() => onDelete(person)}
      />
    </article>
  );
}
