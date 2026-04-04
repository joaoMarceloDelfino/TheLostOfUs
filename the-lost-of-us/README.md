# The Lost Of Us - Guia de Setup

Este projeto usa:

- Docker Compose para banco de dados (PostgreSQL + PostGIS)
- Next.js para frontend e backend
- Clerk para autenticação
- Prisma como ORM

## 1) Pre-requisitos

Instale antes de tudo:

- Node.js 20+ (recomendado: LTS)
- Docker Desktop (com Docker Compose)
- Git

Para conferir se esta tudo instalado:

```bash
node -v
npm -v
docker --version
docker compose version
```

## 2) Baixar dependencias do projeto

Na raiz do projeto, rode:

```bash
npm install
```

## 3) Criar o arquivo .env a partir do .env.example

Este projeto usa variaveis de ambiente para conectar banco e Clerk.

1. Crie uma copia do arquivo `.env.example` com o nome `.env` e adapte as variaveis conforme necessário.


## 4) Subir banco com Docker Compose

Com Docker Desktop aberto, rode na raiz do projeto:

```bash
docker compose up -d
```

Isso vai subir o container do banco:

- Container: `the-lost-of-us-db`
- Porta local: `5433`
- Banco: `the_lost_of_us`

Para verificar se subiu:

```bash
docker compose ps
```

## 5) Aplicar migrations com Prisma

Com o banco em pe, rode:

```bash
npx prisma migrate deploy
```

Opcional (abrir interface do banco):

```bash
npx prisma studio
```

## 6) Rodar o projeto

```bash
npm run dev
```

Abra no navegador:

`http://localhost:3000`

## Comandos uteis

Parar o banco:

```bash
docker compose down
```

Apagar volumes do banco (reset completo dos dados):

```bash
docker compose down -v
```

## Resumo rapido

```bash
npm install
# Renomear e preencher .env
docker compose up -d
npx prisma migrate deploy
npm run dev
```
