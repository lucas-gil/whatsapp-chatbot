FROM node:20-alpine

WORKDIR /app

# Clonar o repositório
RUN apk add --no-cache git && \
    git clone https://github.com/lucas-gil/whatsapp-chatbot.git . && \
    pwd && ls -la && \
    cd apps/api && \
    npm install

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["npm", "start"]
