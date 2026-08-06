FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# As NEXT_PUBLIC_* são embutidas no bundle do navegador durante o build — não
# são lidas em runtime. Por isso precisam existir AQUI, senão a tela de login
# sobe sem saber com qual projeto Supabase falar.
#
# Os dois valores são públicos por natureza: a chave publicável foi feita para
# viajar no JavaScript do navegador, e no Postgres ela não tem permissão de
# leitura em nenhuma tabela (RLS ligada + grants revogados). Ela só serve para
# autenticar. A secret key NUNCA entra aqui — ela é lida em runtime.
ARG NEXT_PUBLIC_SUPABASE_URL=https://rbiybbwmsoxxfpmtnxue.supabase.co
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_JK02ityJ0lweWwOuQWRcmQ_KkCV31FS
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# SUPABASE_SECRET_KEY vem do Environment do EasyPanel, em runtime.
# O volume /app/data saiu junto com o SQLite: o estado agora vive no Supabase,
# então este serviço pode escalar para mais de uma réplica.
CMD ["node", "server.js"]
