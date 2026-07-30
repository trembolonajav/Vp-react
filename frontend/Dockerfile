# Ponte temporária de paridade: remover esta etapa quando todas as rotas de
# VPLab e Bazaar estiverem ativas em frontend/src.
FROM node:22-alpine AS static-build
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci
COPY apps ./apps
COPY scripts ./scripts
RUN npm run build

# O portal, a Store e as áreas autenticadas continuam no SPA React.
FROM node:22-alpine AS react-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Mantém o legado atualizado durante a migração; não é a arquitetura final.
RUN rm -rf dist/vplab dist/bazaar dist/store && mkdir -p dist/vplab/legacy
COPY --from=static-build /workspace/dist/vplab ./dist/vplab/legacy
COPY --from=static-build /workspace/dist/bazaar ./dist/bazaar
COPY --from=static-build /workspace/dist/store ./dist/store
COPY --from=static-build /workspace/dist/assets ./dist/assets
COPY --from=static-build /workspace/dist/config.js ./dist/config.js
COPY --from=static-build /workspace/dist/dados.js ./dist/dados.js
COPY --from=static-build /workspace/dist/styles.css ./dist/styles.css

FROM nginx:1.27-alpine AS runtime
RUN rm -f /etc/nginx/conf.d/default.conf
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=react-build /app/dist /usr/share/nginx/html
EXPOSE 80
