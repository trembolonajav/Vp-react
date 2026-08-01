# Arquitetura

## Decisão

A plataforma usa um monorepositório e um único deployment Docker Compose. O
frontend é uma SPA React/TypeScript construída pelo Vite; o backend oficial é
Java 21 com Spring Boot. Não há runtime estático legado nem funções Vercel.

```text
Navegador
   |
   v
Nginx + SPA React (frontend/) -- /api e /media --> Spring Boot (backend/)
                                                       |          |
                                                       v          v
                                                   PostgreSQL   MinIO/S3
```

## Responsabilidades

- `frontend/`: Hub, Store, Bazaar, VPLab, autenticação e administração.
- `backend/`: API REST `/api/v1`, JWT, regras de negócio, OCR PaddleOCR e persistência.
- PostgreSQL: dados relacionais e migrations Flyway.
- MinIO/S3: mídia enviada pelos usuários.
- Nginx: bundle Vite, fallback da SPA, redirects históricos e proxy.

## Regras

1. `frontend/dist/` é saída gerada e não deve ser editada.
2. Páginas e componentes ficam em `frontend/src`; assets públicos necessários ficam em `frontend/public`.
3. Endpoints ficam em `backend/src`; não existe API Node paralela.
4. Mudanças de banco recebem nova migration Flyway.
5. Segredos nunca entram no Git.
6. A execução oficial é `docker compose up --build`.

## Rotas

- `/`, `/store`, `/bazaar/*`, `/vplab/*`, `/admin` e `/login`: SPA React.
- `/api/v1/*`: API Spring Boot.
- `/media/*`: objetos servidos pelo backend/storage.
- URLs históricas com `.html`: redirects no Nginx.
