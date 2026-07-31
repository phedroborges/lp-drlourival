"use client";
import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

export default function CaboModal({ cabo, bairro, lideres, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(cabo ? { ...cabo, lider_id: cabo.lider_id || "" } : { nome: "", contato: "", endereco: "", lider_id: "", bairro_id: bairro.id });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  async function submit(event) {
    event.preventDefault();
    if (!form.nome.trim()) return;
    await onSave({ ...form, lider_id: form.lider_id ? Number(form.lider_id) : null, bairro_id: bairro.id });
  }

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="gap-0">
        <SheetHeader>
          <SheetTitle>{cabo ? "Editar cabo eleitoral" : "Adicionar cabo eleitoral"}</SheetTitle>
          <SheetDescription>{bairro.nome}</SheetDescription>
        </SheetHeader>
        <form className="form-stack flex-1 overflow-y-auto px-4" onSubmit={submit} id="cabo-form">
          <Label className="flex-col items-start gap-1">
            Nome completo *
            <Input autoFocus value={form.nome} onChange={(e) => update("nome", e.target.value)} />
          </Label>
          <Label className="flex-col items-start gap-1">
            Telefone ou WhatsApp
            <Input value={form.contato} onChange={(e) => update("contato", e.target.value)} />
          </Label>
          <Label className="flex-col items-start gap-1">
            Liderança responsável
            <Select value={form.lider_id ? String(form.lider_id) : "nenhuma"} onValueChange={(value) => update("lider_id", value === "nenhuma" ? "" : value)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value) =>
                    value === "nenhuma"
                      ? "Ainda sem responsável"
                      : (lideres.find((lider) => String(lider.id) === value)?.nome ?? "Ainda sem responsável")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhuma">Ainda sem responsável</SelectItem>
                {lideres.map((lider) => <SelectItem key={lider.id} value={String(lider.id)}>{lider.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </Label>
          <Label className="flex-col items-start gap-1">
            Endereço / ponto de referência
            <Input value={form.endereco || ""} onChange={(e) => update("endereco", e.target.value)} placeholder="Útil para montar a rota" />
          </Label>
        </form>
        <SheetFooter className="flex-row items-center justify-between border-t">
          {cabo ? (
            <Button type="button" variant="destructive" onClick={() => setConfirmOpen(true)}>Excluir cabo</Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" form="cabo-form">Salvar cabo</Button>
          </div>
        </SheetFooter>
      </SheetContent>
      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Excluir ${cabo?.nome}?`}
        onConfirm={() => onDelete(cabo)}
      />
    </Sheet>
  );
}
