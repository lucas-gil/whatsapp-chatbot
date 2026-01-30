FROM node:18-alpine

WORKDIR /app

# Copiar tudo que existe
COPY . .

# Verificar o que foi copiado
RUN ls -la

# Tentar instalar - será na pasta correta automaticamente
RUN npm install 2>&1 || (find . -name package.json -type f | head -1 | xargs dirname | xargs -I {} bash -c "cd {} && npm install")

# Build
RUN npm run build 2>&1 || (find . -name "dist" -type d | head -1 | xargs dirname | xargs -I {} bash -c "cd {} && npm run build")

EXPOSE 3000

CMD ["node", "dist/index.js"]
