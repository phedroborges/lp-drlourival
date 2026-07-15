import TemperatureBadge from "@/app/ui/TemperatureBadge";

function LeaderCard({ leader, bairros, cabos, onEdit }) {
  const territories = bairros.filter((bairro) => leader.bairro_ids?.includes(bairro.id));
  const leaderCabos = cabos.filter((cabo) => cabo.lider_id === leader.id);
  return (
    <article className="org-leader-card">
      <button className="card-edit" onClick={() => onEdit(leader)} aria-label={`Editar ${leader.nome}`}>Editar</button>
      <div className="person-avatar">{leader.nome.slice(0, 2).toUpperCase()}</div>
      <div className="person-copy"><h4>{leader.nome}</h4><p>{leader.cargo || "Liderança territorial"}</p><TemperatureBadge value={leader.classificacao} /></div>
      <div className="org-foot"><span>{territories.length} territórios</span><span>{leaderCabos.length} cabos</span></div>
      {territories.length ? <div className="territory-chips">{territories.slice(0, 4).map((bairro) => <span key={bairro.id}>{bairro.nome}</span>)}{territories.length > 4 ? <span>+{territories.length - 4}</span> : null}</div> : <p className="attention-note">Defina os territórios desta liderança.</p>}
    </article>
  );
}

function LeaderStack({ leaders, bairros, cabos, onEdit }) {
  const visible = leaders.slice(0, 4);
  const remaining = leaders.slice(4);

  return (
    <div className="leader-stack">
      {visible.map((leader) => <LeaderCard key={leader.id} leader={leader} bairros={bairros} cabos={cabos} onEdit={onEdit} />)}
      {remaining.length ? (
        <details className="org-more">
          <summary>Ver mais {remaining.length} lideranças</summary>
          <div className="leader-stack org-more-list">
            {remaining.map((leader) => <LeaderCard key={leader.id} leader={leader} bairros={bairros} cabos={cabos} onEdit={onEdit} />)}
          </div>
        </details>
      ) : null}
    </div>
  );
}

export default function OrgChart({ cidade, onEdit, onAdd }) {
  const bairros = cidade.grupos.flatMap((grupo) => grupo.bairros);
  const cabos = bairros.flatMap((bairro) => bairro.cabos);
  const coordinators = cidade.lideres.filter((item) => item.nivel === "coordenacao");
  const leaders = cidade.lideres.filter((item) => item.nivel !== "coordenacao");
  const direct = leaders.filter((item) => !item.responsavel_id || !coordinators.some((coord) => coord.id === item.responsavel_id));

  if (!cidade.lideres.length) return <div className="empty-state"><span>◎</span><h3>A estrutura começa pela coordenação</h3><p>Adicione a primeira pessoa e escolha o papel dela. O organograma será montado automaticamente.</p><button className="primary-button" onClick={() => onAdd()}>Adicionar primeira pessoa</button></div>;

  return (
    <div className="org-chart">
      <div className="org-root"><span>Comando municipal</span><strong>{cidade.nome}</strong><small>{cidade.lideres.length} pessoas · {cabos.length} cabos</small></div>
      <div className="org-trunk" />
      <div className="coord-grid">
        {coordinators.map((coordinator) => {
          const team = leaders.filter((leader) => leader.responsavel_id === coordinator.id);
          return <section className="coord-branch" key={coordinator.id}>
            <article className="coord-card"><button className="card-edit" onClick={() => onEdit(coordinator)}>Editar</button><span className="role-label">Coordenação</span><div className="person-avatar light">{coordinator.nome.slice(0, 2).toUpperCase()}</div><h3>{coordinator.nome}</h3><p>{coordinator.cargo || "Coordenação municipal"}</p><TemperatureBadge value={coordinator.classificacao} /><div className="coord-summary"><span>{team.length} líderes</span><span>{team.reduce((sum, leader) => sum + (leader.bairro_ids?.length || 0), 0)} territórios</span></div></article>
            <div className="branch-line" />
            {team.length ? <LeaderStack leaders={team} bairros={bairros} cabos={cabos} onEdit={onEdit} /> : <button className="empty-branch" onClick={() => onAdd(coordinator.id)}>+ Adicionar liderança nesta coordenação</button>}
          </section>;
        })}
        {direct.length ? <section className="coord-branch direct-branch"><article className="coord-card neutral-card"><span className="role-label">Ligação direta</span><h3>Equipe da cidade</h3><p>Lideranças ainda sem coordenação definida</p><div className="coord-summary"><span>{direct.length} líderes</span></div></article><div className="branch-line" /><LeaderStack leaders={direct} bairros={bairros} cabos={cabos} onEdit={onEdit} /></section> : null}
      </div>
    </div>
  );
}
