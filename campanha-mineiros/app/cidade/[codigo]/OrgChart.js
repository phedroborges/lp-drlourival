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

function ChefeBranch({ chefe, leaders, bairros, cabos, onEdit, onAdd }) {
  const team = leaders.filter((leader) => leader.responsavel_id === chefe.id);
  const territorios = team.reduce((sum, leader) => sum + (leader.bairro_ids?.length || 0), 0);
  const totalCabos = team.reduce((sum, leader) => sum + cabos.filter((cabo) => cabo.lider_id === leader.id).length, 0);
  return (
    <section className="chefe-branch">
      <article className="coord-card chefe-card">
        <button className="card-edit" onClick={() => onEdit(chefe)}>Editar</button>
        <span className="role-label">Chefe de gabinete</span>
        <div className="person-avatar">{chefe.nome.slice(0, 2).toUpperCase()}</div>
        <h4>{chefe.nome}</h4>
        <p>{chefe.cargo || "Chefia de gabinete"}</p>
        <TemperatureBadge value={chefe.classificacao} />
        <div className="coord-summary"><span>{team.length} lideranças</span><span>{territorios} territórios</span><span>{totalCabos} cabos</span></div>
      </article>
      <div className="branch-line" />
      {team.length ? <LeaderStack leaders={team} bairros={bairros} cabos={cabos} onEdit={onEdit} /> : <button className="empty-branch" onClick={() => onAdd({ nivel: "lideranca", responsavel_id: chefe.id })}>+ Adicionar liderança neste gabinete</button>}
    </section>
  );
}

export default function OrgChart({ cidade, onEdit, onAdd }) {
  const bairros = cidade.grupos.flatMap((grupo) => grupo.bairros);
  const cabos = bairros.flatMap((bairro) => bairro.cabos);
  const coordinators = cidade.lideres.filter((item) => item.nivel === "coordenacao");
  const chefes = cidade.lideres.filter((item) => item.nivel === "chefe_gabinete");
  const leaders = cidade.lideres.filter((item) => item.nivel === "lideranca");
  const chefeIds = new Set(chefes.map((item) => item.id));
  const direct = leaders.filter((item) => !item.responsavel_id || !chefeIds.has(item.responsavel_id));

  if (!cidade.lideres.length) return <div className="empty-state"><span>◎</span><h3>A estrutura começa pela coordenação</h3><p>Adicione a primeira pessoa e escolha o papel dela. O organograma será montado automaticamente.</p><button className="primary-button" onClick={() => onAdd()}>Adicionar primeira pessoa</button></div>;

  return (
    <div className="org-chart">
      <div className="org-root"><span>Coordenação geral · estrutura local</span><strong>{cidade.nome}</strong><small>{coordinators.length} na coordenação da campanha · {chefes.length} chefes de gabinete · {leaders.length} lideranças locais · {cabos.length} cabos</small></div>
      <div className="org-trunk" />
      <section className="coord-collective">
        <div className="coord-collective-head"><span className="role-label">Coordenação de toda a campanha</span><p>Comanda toda a estrutura de {cidade.nome} em conjunto — sem hierarquia entre eles.</p></div>
        <div className="coord-collective-grid">
          {coordinators.length ? coordinators.map((coordinator) => (
            <article className="coord-card" key={coordinator.id}>
              <button className="card-edit" onClick={() => onEdit(coordinator)}>Editar</button>
              <div className="person-avatar light">{coordinator.nome.slice(0, 2).toUpperCase()}</div>
              <h3>{coordinator.nome}</h3>
              <p>{coordinator.cargo || "Coordenação geral da campanha"}</p>
              <span className="coord-global-note">Mesma coordenação em todas as cidades</span>
            </article>
          )) : <button className="empty-branch" onClick={() => onAdd({ nivel: "coordenacao" })}>+ Adicionar coordenação</button>}
        </div>
      </section>
      <div className="branch-line" />
      {chefes.length ? <div className="chefe-grid">{chefes.map((chefe) => <ChefeBranch key={chefe.id} chefe={chefe} leaders={leaders} bairros={bairros} cabos={cabos} onEdit={onEdit} onAdd={onAdd} />)}</div> : null}
      {direct.length ? <section className="coord-branch direct-branch"><article className="coord-card neutral-card"><span className="role-label">Ligação direta com a coordenação</span><h3>Equipe de {cidade.nome}</h3><p>Lideranças ainda sem chefe de gabinete definido</p><div className="coord-summary"><span>{direct.length} líderes</span></div></article><div className="branch-line" /><LeaderStack leaders={direct} bairros={bairros} cabos={cabos} onEdit={onEdit} /></section> : null}
      {!chefes.length && !direct.length ? <button className="empty-branch" onClick={() => onAdd({ nivel: "chefe_gabinete" })}>+ Adicionar chefe de gabinete ou liderança</button> : null}
    </div>
  );
}
