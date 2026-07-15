import TemperatureBadge from "@/app/ui/TemperatureBadge";

export default function PeopleView({ cidade, onEdit, onAdd }) {
  const coordinators = cidade.lideres.filter((person) => person.nivel === "coordenacao");
  const leaders = cidade.lideres.filter((person) => person.nivel !== "coordenacao");
  return (
    <div className="people-view">
      <div className="section-toolbar"><div><h2>Pessoas da operação</h2><p>Informações limpas para consulta. Os campos aparecem somente quando você edita.</p></div><button className="primary-button" onClick={() => onAdd()}>+ Adicionar pessoa</button></div>
      {[{ title: "Coordenação", items: coordinators }, { title: "Lideranças", items: leaders }].map((group) => <section key={group.title} className="people-group"><h3>{group.title} <span>{group.items.length}</span></h3><div className="people-grid">{group.items.map((person) => {
        const coordinator = coordinators.find((item) => item.id === person.responsavel_id);
        return <article className="person-card" key={person.id}><button className="card-edit" onClick={() => onEdit(person)}>Editar</button><div className="person-card-head"><div className="person-avatar">{person.nome.slice(0, 2).toUpperCase()}</div><div><h4>{person.nome}</h4><p>{person.cargo || (person.nivel === "coordenacao" ? "Coordenação" : "Liderança")}</p></div></div><TemperatureBadge value={person.classificacao} /><dl>{person.contato ? <><dt>Contato</dt><dd>{person.contato}</dd></> : null}{coordinator ? <><dt>Coordenação</dt><dd>{coordinator.nome}</dd></> : null}<dt>Territórios</dt><dd>{person.bairro_ids?.length || 0} vinculados</dd>{person.observacao ? <><dt>Próxima ação</dt><dd>{person.observacao}</dd></> : null}</dl></article>;
      })}{!group.items.length ? <button className="empty-person-card" onClick={() => onAdd()}>+ Adicionar {group.title.toLowerCase()}</button> : null}</div></section>)}
    </div>
  );
}
