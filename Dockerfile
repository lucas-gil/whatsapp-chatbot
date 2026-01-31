FROM node:20-alpine

WORKDIR /app

# Instalar git
RUN apk add --no-cache git

# Clonar repositório
RUN git clone https://github.com/lucas-gil/whatsapp-chatbot.git .

# Instalar dependências raiz
RUN npm install --production

# Build da API
WORKDIR /app/apps/api
RUN npm install --production

# Build do Proxy
WORKDIR /app/apps/proxy
RUN npm install --production

# Build do Admin (Next.js)
WORKDIR /app/apps/admin
RUN npm install
RUN npm run build

# Volta para app
WORKDIR /app

EXPOSE 80 3000 3001 8080

# Carregar variáveis de ambiente
ENV PORT=3000
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Rodar todos: Proxy (8080), API (3000) e Admin (3001)
CMD ["sh", "-c", "cd /app/apps/proxy && PORT=8080 npm start & cd /app/apps/api && PORT=3000 npm start & sleep 3 && cd /app/apps/admin && PORT=3001 npm start"]


