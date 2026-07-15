# Dados da campanha

Painel territorial da campanha do Dr. Lourival, organizado por município,
lideranças, bairros e cabos eleitorais.

## Desenvolvimento local

Requer Node.js 24 por usar o módulo nativo `node:sqlite`.

```bash
npm ci
npm run dev
```

O banco local é criado em `data/campanha.db` e não deve ser enviado ao Git.

## EasyPanel

- repositório: `phedroborges/lp-drlourival`
- branch: `main`
- build path: `/campanha-mineiros`
- build: `Dockerfile`
- porta interna: `3000`
- domínio: `dados.tocomdrlourival.com`
- volume persistente: `/app/data`
- réplicas: `1`

O volume é obrigatório para que os cadastros sobrevivam a novos deploys.
SQLite exige que este serviço permaneça com uma única réplica.
