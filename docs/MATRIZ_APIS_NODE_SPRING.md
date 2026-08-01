# Matriz de APIs Node × Spring

Decisão: o deploy oficial é Docker Compose. README e Compose apresentam esse
caminho como recomendado e ele é o único compatível com a arquitetura atual.
O deploy Vercel independente será encerrado; `api/` não é usado pelo Docker.

| Endpoint Node | Spring equivalente | React/Docker | Vercel antigo | Persistência | Estado |
|---|---|---|---|---|---|
| `GET /api/config` | `GET /api/v1/config` | Spring | Node | PostgreSQL / Blob | `SPRING_ACTIVE_NODE_UNUSED` |
| `POST /api/login` | `POST /api/v1/auth/login` | Spring | Node | PostgreSQL / cookie | `SPRING_ACTIVE_NODE_UNUSED` |
| `POST /api/logout` | `POST /api/v1/auth/logout` | Spring | Node | JWT stateless / cookie | `SPRING_ACTIVE_NODE_UNUSED` |
| `GET/PUT /api/admin/config` | `PUT /api/v1/admin/config` + config pública | Spring | Node | PostgreSQL / Blob | `SPRING_ACTIVE_NODE_UNUSED` |
| `POST /api/admin/upload` | `POST /api/v1/media` | Spring | Node | MinIO / Blob | `SPRING_ACTIVE_NODE_UNUSED` |
| `GET/POST /api/bazaar/auth` | `/api/v1/auth/{me,login,register,logout}` | Spring | Node | PostgreSQL / Blob | `SPRING_ACTIVE_NODE_UNUSED` |
| `GET/POST /api/bazaar/chat` | `/api/v1/conversations/**` | Spring | Node | PostgreSQL / Blob | `SPRING_ACTIVE_NODE_UNUSED` |
| `GET /api/bazaar/og` | `/api/v1/share/{id}/image.png` | Spring | Node | PostgreSQL | `SPRING_ACTIVE_NODE_UNUSED` |
| `GET/POST /api/bazaar/profile` | `/api/v1/profiles/{username,me}` | Spring | Node | PostgreSQL / Blob | `SPRING_ACTIVE_NODE_UNUSED` |
| `POST /api/bazaar/report` | `POST /api/v1/reports` | Spring | Node | PostgreSQL / Blob | `SPRING_ACTIVE_NODE_UNUSED` |
| `GET /api/bazaar/share` | `GET /api/v1/share/{id}` | Spring | Node | PostgreSQL | `SPRING_ACTIVE_NODE_UNUSED` |

Funcionalidades sem equivalente Node completo — listings, favoritos, moderação
e mídia S3 — reforçam que a Vercel antiga já não oferece paridade funcional.

