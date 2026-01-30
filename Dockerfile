FROM node:18-alpine

WORKDIR /app

COPY apps/api/package.json apps/api/package-lock.json ./

RUN npm install

COPY apps/api/src ./src
COPY apps/api/tsconfig.json ./

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
