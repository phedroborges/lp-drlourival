"use client";
import { useState } from "react";
import Modal from "@/app/ui/Modal";

export default function CaboModal({ cabo, bairro, lideres, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(cabo ? { ...cabo, lider_id: cabo.lider_id || "" } : { nome: "", contato: "", endereco: "", lider_id: "", bairro_id: bairro.id });
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return (
    <Modal title={cabo ? "Editar cabo eleitoral" : "Adicionar cabo eleitoral"} eyebrow={bairro.nome} onClose={onClose}>
      <form className="form-stack" onSubmit={async (event) => { event.preventDefault(); if (form.nome.trim()) await onSave({ ...form, lider_id: form.lider_id ? Number(form.lider_id) : null, bairro_id: bairro.id }); }}>
        <label><span>Nome completo *</span><input autoFocus value={form.nome} onChange={(e) => update("nome", e.target.value)} /></label>
        <label><span>Telefone ou WhatsApp</span><input value={form.contato} onChange={(e) => update("contato", e.target.value)} /></label>
        <label><span>Liderança responsável</span><select value={form.lider_id} onChange={(e) => update("lider_id", e.target.value)}><option value="">Ainda sem responsável</option>{lideres.map((lider) => <option key={lider.id} value={lider.id}>{lider.nome}</option>)}</select></label>
        <label><span>Endereço / ponto de referência</span><input value={form.endereco || ""} onChange={(e) => update("endereco", e.target.value)} placeholder="Útil para montar a rota" /></label>
        <footer className="modal-actions">
          {cabo ? <button type="button" className="danger-button" onClick={() => onDelete(cabo)}>Excluir cabo</button> : <span />}
          <div><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit">Salvar cabo</button></div>
        </footer>
      </form>
    </Modal>
  );
}
