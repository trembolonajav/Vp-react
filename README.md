# Plataforma Vpertz

Aplicação da comunidade Vpertz (streamer de PokeIdle World): hub, loja de
diamonds (VP Store), marketplace entre jogadores (VP Bazaar), ferramentas
(VPLab) e painel administrativo.

Arquitetura atual: toda a interface (Hub, Store, Bazaar, VPLab e Admin) usa
**React + TypeScript + Vite**; o backend oficial usa **Java 21 + Spring Boot**,
com **PostgreSQL** e **MinIO/S3**. Tudo é orquestrado por **Docker Compose**.

## 1. Arquitetura

```
                 ┌───────────────────────────┐
                 │  Frontend (React/TS/Vite)  │   nginx serve o SPA e faz
                 │  hub / store / bazaar /    │   proxy de /api e /media
                 │  vplab / admin             │
                 └───────────────┬────────────┘
                                 │ REST /api/v1
                 ┌───────────────▼────────────┐
                 │  Backend (Spring Boot)      │
                 │  Web · Data JPA · Security  │
                 │  (JWT) · Flyway · Bean Val. │
                 └──────┬───────────────┬──────┘
                        │               │
                 ┌──────▼─────┐  ┌──────▼───────────┐
                 │ PostgreSQL │  │ StorageService    │
                 │  (Flyway)  │  │ local (volume);   │
                 └────────────┘  │ pluga S3/MinIO    │
                                 └───────────────────┘
```

Áreas (rotas do frontend): hub em `/`, loja em `/store`, marketplace em
`/bazaar`, ferramentas em `/vplab/`, painel em
`/admin`, login em `/login`.

API REST versionada em `/api/v1`: `config`, `listings`, `auth`,
`conversations` (chat), `reports`, `profiles`, `media` e `admin`. Erros são
padronizados (`{status, error, message, timestamp, path}`).

## 2. Requisitos

- **Docker** + **Docker Compose** (caminho recomendado — sobe tudo).
- Para rodar os serviços separadamente: **Java 21**, **Maven 3.9+**,
  **Node 20+** e um **PostgreSQL 16**.

## 3. Configuração / variáveis de ambiente

Copie o exemplo e ajuste (nunca versione o `.env` com valores reais):

```bash
cp .env.example .env
```

| Variável | Para quê |
|---|---|
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Banco |
| `SPRING_PROFILES_ACTIVE` | `dev` (semeia dados) ou `prod` |
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | Conexão do backend |
| `APP_CORS_ALLOWED_ORIGINS` | Origens liberadas (nunca `*` com credenciais) |
| `STORAGE_DIR` | Diretório dos uploads (volume em Docker) |
| `JWT_SECRET` | Assinatura do token (mín. 32 bytes) |
| `ADMIN_USER` / `ADMIN_PASS` | Semente do admin do painel |
| `FRONTEND_PORT` / `BACKEND_PORT` | Portas publicadas |

## 4. Subir com Docker (recomendado)

```bash
docker compose up --build
```

- Frontend: <http://localhost:8090>
- Backend: <http://localhost:8080> (health em `/actuator/health`)
- PostgreSQL: `localhost:5432`

O Postgres sobe primeiro; o backend aplica as migrations (Flyway) e, em `dev`,
semeia os dados iniciais. O nginx serve exclusivamente o bundle Vite e faz
proxy de `/api` e `/media` para o backend.

Admin de desenvolvimento (perfil `dev`): **`vpadmin` / `vpadmin123`**
(troque em produção via `ADMIN_USER`/`ADMIN_PASS`).

## 5. Rodar o frontend separadamente

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 (proxy /api e /media -> :8080)
npm run build      # typecheck (tsc) + bundle de produção
```

## 6. Rodar o backend separadamente

Requer um PostgreSQL acessível e as variáveis de conexão (ver `.env.example`).

```bash
cd backend
mvn spring-boot:run
```

## 7. Acessar o PostgreSQL

```bash
docker compose exec postgres psql -U vpertz -d vpertz
```

## 8. Migrations (Flyway)

Rodam automaticamente na subida do backend. Cada mudança de schema é um novo
arquivo `backend/src/main/resources/db/migration/V<n>__descricao.sql` — **nunca
edite uma migração já aplicada**; crie a próxima.

## 9. Testes

```bash
cd backend && mvn test      # requer JDK 21
cd frontend && npm run build # typecheck do frontend
```

## 10. Estrutura

```
Vpertz/
├── backend/                 # Java 21 + Spring Boot (modular monolith por domínio)
│   ├── src/main/java/com/vpertz/{config,catalog,content,taxonomy,
│   │        listings,users,auth,chat,reports,media,admin,common}
│   ├── src/main/resources/{application.yml, db/migration, seed}
│   ├── pom.xml  Dockerfile
├── frontend/                # React + TS + Vite (toda a interface)
│   ├── src/{features,components,contexts,hooks,services,types,utils,styles}
│   ├── vite.config.ts  Dockerfile  nginx.conf
├── docker-compose.yml  .env.example
└── docs/                    # arquitetura, migração e auditorias
```
