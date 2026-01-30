FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/

RUN npm install --legacy-peer-deps

COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

WORKDIR /app/apps/api

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
