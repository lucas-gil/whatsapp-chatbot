FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install && npm run build -w apps/api

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/index.js"]
