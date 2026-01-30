FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache git

RUN git clone https://github.com/lucas-gil/whatsapp-chatbot.git .

# Build da API
WORKDIR /app/apps/api
RUN npm install --production

# Build do Admin (Next.js)
WORKDIR /app/apps/admin
RUN npm install --production
RUN npm run build

EXPOSE 3000 3001

# Rodar API na porta 3000 e Admin na porta 3001
CMD sh -c "cd /app/apps/api && npm start & cd /app/apps/admin && npm start"


