import TemperatureBadge from "@/app/ui/TemperatureBadge";

function cargoPadrao(nivel) {
  if (nivel === "coordenacao") return "Coordenação da campanha";
  if (nivel === "chefe_gabinete") return "Chefe de gabinete";
  return "Liderança";
}

export default function PeopleView({ cidade, onEdit, onAdd }) {
  const coordinators = cidade.lideres.filter((person) => person.nivel === "coordenacao");
  const chefes = cidade.lideres.filter((person) => person.nivel === "chefe_gabinete");
  const leaders = cidade.lideres.filter((person) => person.nivel === "lideranca");
  const superiors = [...coordinators, ...chefes];
  return (
    <div className="people-view">
      <div className="section-toolbar"><div><h2>Pessoas da operação</h2><p>A coordenação é compartilhada por toda a campanha. Chefes de gabinete e lideranças abaixo pertencem somente a {cidade.nome}.</p></div><button className="primary-button" onClick={() => onAdd()}>+ Adicionar pessoa</button></div>
      {[{ title: "Coordenação da campanha", items: coordinators, global: true }, { title: `Chefes de gabinete de ${cidade.nome}`, items: chefes, global: false }, { title: `Lideranças de ${cidade.nome}`, items: leaders, global: false }].map((group) => <section key={group.title} className="people-group"><h3>{group.title} <span>{group.items.length}</span>{group.global ? <small className="global-scope-badge">Global · todas as cidades</small> : null}</h3><div className="people-grid">{group.items.map((person) => {
        const superior = superiors.find((item) => item.id === person.responsavel_id);
        return <article className="person-card" key={person.id}><button className="card-edit" onClick={() => onEdit(person)}>Editar</button><div className="person-card-head"><div className="person-avatar">{person.nome.slice(0, 2).toUpperCase()}</div><div><h4>{person.nome}</h4><p>{person.cargo || cargoPadrao(person.nivel)}</p></div></div>{person.nivel !== "coordenacao" ? <TemperatureBadge value={person.classificacao} /> : <span className="person-global-label">Atua em toda a campanha</span>}<dl>{person.contato ? <><dt>Contato</dt><dd>{person.contato}</dd></> : null}{superior ? <><dt>Reporta a</dt><dd>{superior.nome}</dd></> : null}{person.nivel !== "coordenacao" ? <><dt>Territórios</dt><dd>{person.bairro_ids?.length || 0} vinculados</dd></> : null}{person.observacao ? <><dt>Próxima ação</dt><dd>{person.observacao}</dd></> : null}</dl></article>;
      })}{!group.items.length ? <button className="empty-person-card" onClick={() => onAdd()}>+ Adicionar {group.title.toLowerCase()}</button> : null}</div></section>)}
    </div>
  );
}
