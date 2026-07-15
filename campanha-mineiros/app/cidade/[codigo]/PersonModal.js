"use client";
import { useMemo, useState } from "react";
import Modal from "@/app/ui/Modal";

const EMPTY = { nome: "", nivel: "lideranca", cargo: "", contato: "", classificacao: "", responsavel_id: "", observacao: "", endereco: "", bairro_ids: [] };

export default function PersonModal({ person, cidade, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(person ? {
    ...EMPTY, ...person,
    responsavel_id: person.responsavel_id || "",
    bairro_ids: person.bairro_ids || [],
  } : EMPTY);
  const coordinators = useMemo(() => cidade.lideres.filter((item) => item.nivel === "coordenacao" && item.id !== person?.id), [cidade, person]);
  const bairros = cidade.grupos.flatMap((grupo) => grupo.bairros);

  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  function toggleBairro(id) {
    update("bairro_ids", form.bairro_ids.includes(id) ? form.bairro_ids.filter((item) => item !== id) : [...form.bairro_ids, id]);
  }
  async function submit(event) {
    event.preventDefault();
    if (!form.nome.trim()) return;
    await onSave({ ...form, responsavel_id: form.responsavel_id ? Number(form.responsavel_id) : null });
  }

  return (
    <Modal title={person ? "Editar pessoa" : "Adicionar pessoa"} eyebrow="Equipe da cidade" onClose={onClose} wide>
      <form className="form-stack" onSubmit={submit}>
        <div className="segmented-control" role="group" aria-label="Papel na estrutura">
          <button type="button" className={form.nivel === "coordenacao" ? "active" : ""} onClick={() => update("nivel", "coordenacao")}>Coordenação</button>
          <button type="button" className={form.nivel === "lideranca" ? "active" : ""} onClick={() => update("nivel", "lideranca")}>Liderança</button>
        </div>
        <div className="form-grid two">
          <label><span>Nome completo *</span><input autoFocus value={form.nome} onChange={(e) => update("nome", e.target.value)} /></label>
          <label><span>Papel / atuação</span><input value={form.cargo} onChange={(e) => update("cargo", e.target.value)} placeholder="Ex.: liderança comunitária" /></label>
          <label><span>Telefone ou WhatsApp</span><input value={form.contato} onChange={(e) => update("contato", e.target.value)} placeholder="(64) 99999-9999" /></label>
          <label><span>Temperatura política</span><select value={form.classificacao} onChange={(e) => update("classificacao", e.target.value)}><option value="">Sem leitura</option><option value="verde">Apoio consolidado</option><option value="amarelo">Em aproximação</option><option value="vermelho">Resistência</option></select></label>
          {form.nivel === "lideranca" ? <label><span>Responde à coordenação</span><select value={form.responsavel_id} onChange={(e) => update("responsavel_id", e.target.value)}><option value="">Direto da cidade</option>{coordinators.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label> : null}
          <label><span>Endereço de referência</span><input value={form.endereco} onChange={(e) => update("endereco", e.target.value)} placeholder="Rua, número ou ponto de apoio" /></label>
        </div>
        {form.nivel === "lideranca" ? <fieldset className="territory-picker"><legend>Territórios de atuação</legend><p>Escolha um ou mais bairros/setores. Isso monta automaticamente o organograma.</p><div>{bairros.map((bairro) => <label key={bairro.id} className={form.bairro_ids.includes(bairro.id) ? "selected" : ""}><input type="checkbox" checked={form.bairro_ids.includes(bairro.id)} onChange={() => toggleBairro(bairro.id)} /><span>{bairro.nome}</span></label>)}</div></fieldset> : null}
        <label><span>Notas estratégicas</span><textarea rows="3" value={form.observacao} onChange={(e) => update("observacao", e.target.value)} placeholder="Contexto, combinados e próximo contato" /></label>
        <footer className="modal-actions">
          {person ? <button type="button" className="danger-button" onClick={() => onDelete(person)}>Excluir pessoa</button> : <span />}
          <div><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit">Salvar pessoa</button></div>
        </footer>
      </form>
    </Modal>
  );
}
