#!/bin/bash

echo "=== Iniciando Deploy ==="

# 1. Clonar repositório
echo "1. Clonando repositório..."
cd /root
rm -rf chronos-prod
git clone https://github.com/dlartartfinal-hash/chronos-app.git chronos-prod

# 2. Entrar no diretório
cd /root/chronos-prod

# 3. Instalar dependências
echo "2. Instalando dependências npm..."
npm install

# 4. Criar arquivo .env.production
echo "3. Criando arquivo .env.production..."
cat > .env.production << 'EOF'
DATABASE_URL=postgresql://chronos_user:chronos123456@localhost:5432/chronos_db
NEXT_PUBLIC_HOST=https://82.29.56.11
NODE_ENV=production
EOF

# 5. Rodar migrações Prisma
echo "4. Rodando migrações Prisma..."
npx prisma migrate deploy

# 6. Build Next.js
echo "5. Buildando aplicação Next.js..."
npm run build

# 7. Iniciar aplicação em background
echo "6. Iniciando aplicação..."
npm start > /root/chronos-app.log 2>&1 &

echo "✅ Deploy completo!"
echo "Acesse: https://82.29.56.11"
