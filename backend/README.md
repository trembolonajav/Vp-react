# Vpertz Backend

Backend da plataforma Vpertz — **modular monolith** em Java 21 + Spring Boot,
PostgreSQL e Flyway. Esta é a fundação da migração (Fase 1): expõe a
configuração pública do site no mesmo contrato do antigo `/api/config`.

## Stack

- Java 21, Spring Boot 3.3 (Web, Data JPA, Validation, Security, Actuator)
- PostgreSQL 16 + Flyway (migrações versionadas em `src/main/resources/db/migration`)
- Docker / Docker Compose

## Estrutura (por domínio)

```
com.vpertz
├── config/      # configuração do site + endpoint-espelho /api/v1/config
├── catalog/     # jogos da loja
├── content/     # banners e contatos
├── taxonomy/    # categorias e servidores do bazaar
└── common/
    ├── exception/  # @RestControllerAdvice + erro padronizado
    ├── security/   # CORS + regras de acesso (JWT chega na fase de auth)
    └── seed/       # carga inicial a partir de seed/config.json (só em dev)
```

## Rodar com Docker (recomendado)

Na raiz do repositório:

```bash
cp .env.example .env      # ajuste as senhas
docker compose up --build
```

- Backend: <http://localhost:8080>
- Config pública: <http://localhost:8080/api/v1/config>
- Health: <http://localhost:8080/actuator/health>

O Postgres sobe junto; o Flyway cria o schema; em `dev` o banco é populado a
partir de `seed/config.json` na primeira execução.

## Rodar o backend isolado

Requer um PostgreSQL acessível e as variáveis `DB_URL`, `DB_USERNAME`,
`DB_PASSWORD` (ver `.env.example`).

```bash
cd backend
./mvnw spring-boot:run     # ou: mvn spring-boot:run
```

## Testes

```bash
cd backend
mvn test
```

## Migrações (Flyway)

Rodam automaticamente na subida da aplicação. Cada mudança de schema é um novo
arquivo `V<n>__descricao.sql` — nunca edite uma migração já aplicada.

## Banco

```bash
docker compose exec postgres psql -U vpertz -d vpertz
```
