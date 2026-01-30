# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de configuração
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package-lock.json ./apps/api/

# Instalar dependências
RUN cd apps/api && npm install

# Copiar código fonte
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/tsconfig.json.bak ./apps/api/ 2>/dev/null || true

# Build
WORKDIR /app/apps/api
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copiar do builder
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/node_modules ./node_modules

# Criar arquivo de registro se necessário
RUN echo "module.exports = {};" > register.js 2>/dev/null || true

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/status', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Iniciar aplicação
CMD ["node", "dist/index.js"]
