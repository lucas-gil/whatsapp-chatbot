FROM node:18-alpine

WORKDIR /app

# Copiar todo o repositório primeiro
COPY . .

# Se está em monorepo, instalar raiz
RUN npm install 2>/dev/null || true

# Navegar para API e instalar
WORKDIR /app/apps/api
RUN npm install

# Build
RUN npm run build

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/index.js"]
