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

Login por e-mail e senha (Supabase Auth). São **duas** barreiras, e a segunda
é a que vale:

1. Ter conta no projeto Supabase.
2. Ter o e-mail na tabela `usuario_autorizado`.

A segunda existe porque a primeira não é suficiente: enquanto o cadastro
público do projeto estiver aberto, qualquer pessoa cria uma conta com a chave
publicável e confirma o próprio e-mail. A lista é conferida a cada requisição
— no `proxy.js` e de novo em `exigirUsuario()` —, então tirar alguém da lista
derruba o acesso na hora, mesmo com a sessão dele ainda válida.

Quem gerencia isso é a tela **Acessos** (`/acessos`), visível apenas para
quem tem `admin = true`. Ela cria a conta de login e libera o acesso numa
ação só, gera senha quando o campo fica vazio (mostrada uma única vez),
redefine senha e remove — apagando a conta junto, para não sobrar login
órfão no projeto. Ninguém consegue remover o próprio acesso nem a própria
administração, senão a campanha ficaria sem quem libera.

Esconder o link do menu não é a proteção: `/api/usuarios` exige `admin` em
todos os métodos e responde 403 para quem não é.

Continua valendo desativar o cadastro público em Authentication → Sign In /
Providers, para o projeto não acumular contas de estranhos — mas isso agora é
higiene, não é o que segura o acesso.

Se precisar mexer direto no banco (por exemplo, para recuperar o primeiro
acesso), a função continua existindo:

```sql
select autorizar_email('pessoa@exemplo.com.br', 'Nome da Pessoa', true);
```

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
