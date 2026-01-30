FROM node:18-alpine

WORKDIR /app

# Copiar tudo
COPY . .

# Tentar instalar na raiz primeiro (em caso de ser monorepo)
RUN npm install --ignore-scripts 2>/dev/null || true

# Depois ir para a API
WORKDIR /app/apps/api

# Instalar dependências da API
RUN npm install

# Compilar TypeScript
RUN npm run build

# Voltar para raiz para executar
WORKDIR /app/apps/api

EXPOSE 3000

# Usar node diretamente no arquivo compilado
CMD ["node", "dist/index.js"]
