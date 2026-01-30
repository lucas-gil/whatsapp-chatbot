# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar todo o projeto primeiro
COPY . .

# Instalar dependências da raiz (monorepo)
RUN npm install

# Build apenas da API
RUN npm run build -w apps/api

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copiar apenas o necessário
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/node_modules ./node_modules

# Expor porta
EXPOSE 3000

# Iniciar aplicação
CMD ["node", "dist/index.js"]
