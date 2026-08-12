FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
COPY docker-entrypoint.sh /usr/local/bin/whatsapp-entrypoint
RUN chmod +x /usr/local/bin/whatsapp-entrypoint && mkdir -p /data/auth
ENV PORT=3000 WHATSAPP_AUTH_DIR=/data/auth
EXPOSE 3000
ENTRYPOINT ["whatsapp-entrypoint"]
