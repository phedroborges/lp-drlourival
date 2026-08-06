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
import TemperaturePicker from "@/app/ui/TemperaturePicker";

export function papelPadrao(nivel) {
  if (nivel === "candidato") return "Candidato";
  if (nivel === "coordenacao") return "Coordenação da campanha";
  if (nivel === "chefe_gabinete") return "Chefe de gabinete";
  if (nivel === "apoiador") return "Apoiador";
  return "Liderança";
}

/** Tags do tipo de liderança. Editadas no modal, não no cartão. */
export function TagChips({ tags = [] }) {
  if (!tags.length) return null;
  return (
    <div className="tag-chips">
      {tags.map((tag) => <span key={tag.id}>{tag.nome}</span>)}
    </div>
  );
}

/**
 * Card de pessoa com edição inline (clique no texto/tag edita na hora).
 * Reusado pela aba Pessoas da cidade e por /equipe.
 */
export default function PersonCard({ person, chefes = [], onQuickUpdate, onEdit, onDelete, footer }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const superior = chefes.find((item) => item.id === person.responsavel_id);

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
          <span className="block text-xs text-muted-foreground">{papelPadrao(person.nivel)}</span>
          <TagChips tags={person.tags} />
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

      {person.nivel !== "coordenacao" ? (
        <div className="quick-tags">
          <TemperaturePicker
            value={person.classificacao || ""}
            onSave={(value) => onQuickUpdate(person, { classificacao: value })}
          />
        </div>
      ) : null}

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
