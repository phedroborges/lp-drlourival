"use client";
import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

const EMPTY = { nome: "", nivel: "lideranca", cargo: "", contato: "", classificacao: "", responsavel_id: "", observacao: "", endereco: "", bairro_ids: [] };

export default function PersonModal({ person, cidade, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(person ? {
    ...EMPTY, ...person,
    responsavel_id: person.responsavel_id || "",
    bairro_ids: person.bairro_ids || [],
  } : EMPTY);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const chefes = useMemo(() => cidade.lideres.filter((item) => item.nivel === "chefe_gabinete" && item.id !== person?.id), [cidade, person]);
  const bairros = cidade.grupos.flatMap((grupo) => grupo.bairros);

  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  function toggleBairro(id) {
    update("bairro_ids", form.bairro_ids.includes(id) ? form.bairro_ids.filter((item) => item !== id) : [...form.bairro_ids, id]);
  }
  async function submit(event) {
    event.preventDefault();
    if (!form.nome.trim()) return;
    const responsavel_id = form.nivel === "lideranca" && form.responsavel_id ? Number(form.responsavel_id) : null;
    await onSave({ ...form, responsavel_id });
  }

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full gap-0 sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{person?.id ? "Editar pessoa" : "Adicionar pessoa"}</SheetTitle>
          <SheetDescription>
            {form.nivel === "coordenacao" ? "Estrutura geral da campanha" : `Equipe de ${cidade.nome}`}
          </SheetDescription>
        </SheetHeader>
        <form className="form-stack flex-1 overflow-y-auto px-4" onSubmit={submit} id="person-form">
          <div className="segmented-control" role="group" aria-label="Papel na estrutura">
            <button type="button" className={form.nivel === "coordenacao" ? "active" : ""} onClick={() => setForm((current) => ({ ...current, nivel: "coordenacao", responsavel_id: "", bairro_ids: [] }))}>Coordenação da campanha</button>
            <button type="button" className={form.nivel === "chefe_gabinete" ? "active" : ""} onClick={() => setForm((current) => ({ ...current, nivel: "chefe_gabinete", responsavel_id: "" }))}>Chefe de gabinete</button>
            <button type="button" className={form.nivel === "lideranca" ? "active" : ""} onClick={() => update("nivel", "lideranca")}>Liderança</button>
            <button type="button" className={form.nivel === "apoiador" ? "active" : ""} onClick={() => setForm((current) => ({ ...current, nivel: "apoiador", responsavel_id: "" }))}>Apoiador</button>
          </div>
          {form.nivel === "apoiador" ? <div className="global-scope-note"><span>◉</span><p><strong>É da cidade e está com a gente</strong><small>Não é uma liderança formal (não reporta a ninguém nem entra no organograma), mas fica registrado como apoio.</small></p></div> : null}
          {form.nivel === "coordenacao" ? <div className="global-scope-note"><span>◉</span><p><strong>Cadastro global</strong><small>Esta pessoa aparecerá na coordenação de todas as cidades. Edite uma vez e a mudança será aplicada em toda a campanha.</small></p></div> : null}
          {form.nivel === "chefe_gabinete" ? <div className="global-scope-note"><span>◉</span><p><strong>Reporta à coordenação como um todo</strong><small>Chefes de gabinete respondem à coordenação em conjunto — não existe vínculo com um coordenador específico.</small></p></div> : null}
          <div className="form-grid two">
            <Label className="flex-col items-start gap-1">
              Nome completo *
              <Input autoFocus value={form.nome} onChange={(e) => update("nome", e.target.value)} />
            </Label>
            <Label className="flex-col items-start gap-1">
              Papel / atuação
              <Input value={form.cargo} onChange={(e) => update("cargo", e.target.value)} placeholder="Ex.: liderança comunitária" />
            </Label>
            <Label className="flex-col items-start gap-1">
              Telefone ou WhatsApp
              <Input value={form.contato} onChange={(e) => update("contato", e.target.value)} placeholder="(64) 99999-9999" />
            </Label>
            {form.nivel !== "coordenacao" ? (
              <Label className="flex-col items-start gap-1">
                Temperatura política
                <Select value={form.classificacao || "sem"} onValueChange={(value) => update("classificacao", value === "sem" ? "" : value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value) =>
                        ({ sem: "Sem leitura", verde: "Apoio consolidado", amarelo: "Em aproximação", vermelho: "Resistência" }[value] ??
                          "Sem leitura")
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem">Sem leitura</SelectItem>
                    <SelectItem value="verde">Apoio consolidado</SelectItem>
                    <SelectItem value="amarelo">Em aproximação</SelectItem>
                    <SelectItem value="vermelho">Resistência</SelectItem>
                  </SelectContent>
                </Select>
              </Label>
            ) : null}
            {form.nivel === "lideranca" ? (
              <Label className="flex-col items-start gap-1">
                Responde a
                <Select value={form.responsavel_id ? String(form.responsavel_id) : "direto"} onValueChange={(value) => update("responsavel_id", value === "direto" ? "" : value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value) =>
                        value === "direto"
                          ? "Direto da coordenação"
                          : (chefes.find((item) => String(item.id) === value)?.nome ?? "Direto da coordenação")
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direto">Direto da coordenação</SelectItem>
                    {chefes.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nome} (chefe de gabinete)</SelectItem>)}
                  </SelectContent>
                </Select>
              </Label>
            ) : null}
            <Label className="flex-col items-start gap-1">
              Endereço de referência
              <Input value={form.endereco} onChange={(e) => update("endereco", e.target.value)} placeholder="Rua, número ou ponto de apoio" />
            </Label>
          </div>
          {form.nivel !== "coordenacao" ? (
            <fieldset className="territory-picker">
              <legend>Territórios de atuação</legend>
              <p>Escolha um ou mais bairros/setores. Isso monta automaticamente o organograma.</p>
              <div>{bairros.map((bairro) => <label key={bairro.id} className={form.bairro_ids.includes(bairro.id) ? "selected" : ""}><input type="checkbox" checked={form.bairro_ids.includes(bairro.id)} onChange={() => toggleBairro(bairro.id)} /><span>{bairro.nome}</span></label>)}</div>
            </fieldset>
          ) : null}
          <Label className="flex-col items-start gap-1">
            Notas estratégicas
            <Textarea rows="3" value={form.observacao} onChange={(e) => update("observacao", e.target.value)} placeholder="Contexto, combinados e próximo contato" />
          </Label>
        </form>
        <SheetFooter className="flex-row items-center justify-between border-t">
          {person ? (
            <Button type="button" variant="destructive" onClick={() => setConfirmOpen(true)}>Excluir pessoa</Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" form="person-form">Salvar pessoa</Button>
          </div>
        </SheetFooter>
      </SheetContent>
      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Excluir ${person?.nome}?`}
        description={
          person?.nivel === "coordenacao"
            ? "Esta pessoa aparece na coordenação de todas as cidades — a exclusão vale para toda a campanha."
            : `Remove essa pessoa da estrutura de ${cidade.nome}.`
        }
        onConfirm={() => onDelete(person)}
      />
    </Sheet>
  );
}
