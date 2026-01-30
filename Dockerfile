FROM node:18-alpine

WORKDIR /app

COPY . .

WORKDIR /app/apps/api

RUN npm install

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
