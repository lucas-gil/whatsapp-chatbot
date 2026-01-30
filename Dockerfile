FROM node:18-alpine

WORKDIR /app

# Clonar o repositório
RUN apk add --no-cache git && \
    git clone https://github.com/lucas-gil/whatsapp-chatbot.git . && \
    cd apps/api && \
    npm install && \
    npm run build

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/index.js"]
