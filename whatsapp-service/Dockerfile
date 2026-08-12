FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
RUN mkdir -p /data/auth && chown -R node:node /data
USER node
ENV PORT=3000 WHATSAPP_AUTH_DIR=/data/auth
EXPOSE 3000
CMD ["npm", "start"]
