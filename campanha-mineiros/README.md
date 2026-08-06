# Dados da campanha

Painel territorial da campanha do Dr. Lourival, organizado por município,
lideranças e cabos eleitorais.

A estrutura é `município → liderança → cabo`. Os níveis de liderança são
`candidato`, `coordenacao` e `chefe_gabinete` (que respondem pela campanha
inteira ou pelo gabinete), além de `lideranca` e `apoiador`. Não existe
divisão por bairro: o território é a própria cidade.

O **tipo de liderança** é um conjunto de tags padronizadas (tabela `tag`,
ligada por `lider_tag`), e não texto livre — antes cada um escrevia "Igreja",
"Igreja / família" e "Liderança de igreja" para a mesma coisa, o que tornava
o filtro inútil. Uma pessoa pode ter quantas tags precisar. A coordenação
cria tags novas pelo próprio modal de pessoa, sem depender de deploy.

## Banco

Postgres no Supabase (projeto `dr-lourival`, região `sa-east-1`).

Todo o acesso ao dado passa pelo servidor do Next usando a *secret key*, que
ignora RLS. As tabelas têm RLS ligada **sem policy nenhuma** e os grants de
`anon` e `authenticated` foram revogados — ou seja, a chave publicável não lê
nada direto do Postgres, só serve para autenticação. Toda query sai de
`lib/db.js` → `lib/supabaseAdmin.js`.

A criação do plano de campo é atômica e vive na função `criar_tarefa_rota`
no próprio Postgres, porque o PostgREST não tem transação entre chamadas.

`lib/municipiosSeed.js` guarda os 246 municípios de Goiás (código IBGE, nome,
sudoeste). O app não o importa mais — ele existe para semear a tabela
`municipio` num projeto novo.

## Acesso

Login por e-mail e senha (Supabase Auth). O cadastro público deve ficar
**desativado**: os usuários são criados pela coordenação em
Supabase → Authentication → Users → *Add user*.

O `proxy.js` (o que até o Next 15 se chamava middleware) renova a sessão e
barra quem não está logado. A única rota pública é o plano de campo
(`/campo/[token]` e `/api/campo/[token]`), que a equipe de rua abre por link.
Cada rota de API confere a sessão de novo via `lib/rota.js`, para não depender
só do proxy.

## Desenvolvimento local

```bash
npm ci
npm run dev
```

Crie um `.env.local` (já ignorado pelo Git) com:

```
NEXT_PUBLIC_SUPABASE_URL=https://rbiybbwmsoxxfpmtnxue.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

A `SUPABASE_SECRET_KEY` nunca vai para o navegador: só é lida em
`lib/supabaseAdmin.js`, que roda no servidor.

## EasyPanel

- repositório: `phedroborges/lp-drlourival`
- branch: `main`
- build path: `/campanha-mineiros`
- build: `Dockerfile`
- porta interna: `3000`
- domínio: `dados.tocomdrlourival.com`
- réplicas: livre (o estado saiu do disco e foi para o Supabase)

Configurar as três variáveis acima em *Environment*. O volume `/app/data`
que existia para o SQLite não é mais necessário e pode ser removido — mas
só depois de confirmar que o `campanha.db` antigo não é mais preciso.
