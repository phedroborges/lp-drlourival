import PersonCard from "@/app/ui/PersonCard";
import { Button } from "@/components/ui/button";

export default function PeopleView({ cidade, onEdit, onAdd, onQuickUpdate, onDelete }) {
  const coordinators = cidade.lideres.filter((person) => person.nivel === "coordenacao");
  const chefes = cidade.lideres.filter((person) => person.nivel === "chefe_gabinete");
  const leaders = cidade.lideres.filter((person) => person.nivel === "lideranca");

  const groups = [
    { title: "Coordenação da campanha", items: coordinators, global: true },
    { title: `Chefes de gabinete de ${cidade.nome}`, items: chefes, global: false },
    { title: `Lideranças de ${cidade.nome}`, items: leaders, global: false },
  ];

  return (
    <div className="people-view">
      <div className="section-toolbar">
        <div>
          <h2>Pessoas da operação</h2>
          <p>
            A coordenação comanda toda a estrutura em conjunto, sem vínculo individual. Clique em
            cima do nome, cargo, telefone ou das etiquetas do cartão pra editar na hora.
          </p>
        </div>
        <Button onClick={() => onAdd()}>+ Adicionar pessoa</Button>
      </div>
      {groups.map((group) => (
        <section key={group.title} className="people-group">
          <h3>
            {group.title} <span>{group.items.length}</span>
            {group.global ? <small className="global-scope-badge">Global · todas as cidades</small> : null}
          </h3>
          <div className="people-grid">
            {group.items.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                chefes={chefes}
                onQuickUpdate={onQuickUpdate}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {!group.items.length ? (
              <button className="empty-person-card" onClick={() => onAdd()}>
                + Adicionar {group.title.toLowerCase()}
              </button>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}
