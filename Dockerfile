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

# Build do Admin (Next.js)
WORKDIR /app/apps/admin
RUN npm install
RUN npm run build

# Volta para app
WORKDIR /app

# Portas expostas
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Rodar ambos os serviços
CMD ["sh", "-c", "cd /app/apps/api && npm start & cd /app/apps/admin && npm start"]


