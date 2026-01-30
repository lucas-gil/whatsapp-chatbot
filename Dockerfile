FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache git

RUN git clone https://github.com/lucas-gil/whatsapp-chatbot.git .

WORKDIR /app/apps/api

RUN npm install --production

EXPOSE 3000

CMD ["npm", "start"]

