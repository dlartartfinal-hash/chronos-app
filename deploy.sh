#!/bin/bash
# Script de Deploy do Chronos POS na Oracle Cloud
# Execute como: bash deploy.sh

set -e

echo "🚀 Iniciando deploy do Chronos POS..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para printar com cor
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# 1. Atualizar sistema
print_info "Atualizando sistema operacional..."
sudo apt update && sudo apt upgrade -y
print_success "Sistema atualizado"

# 2. Instalar Node.js
print_info "Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
print_success "Node.js instalado: $(node --version)"

# 3. Instalar PostgreSQL
print_info "Instalando PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
print_success "PostgreSQL instalado"

# 4. Instalar Nginx
print_info "Instalando Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
print_success "Nginx instalado"

# 5. Instalar Certbot (SSL)
print_info "Instalando Certbot para SSL..."
sudo apt install -y certbot python3-certbot-nginx
print_success "Certbot instalado"

# 6. Clonar repositório (você precisa fazer isso manualmente com SSH)
print_info "Clone o repositório do seu projeto Git"
print_info "git clone https://github.com/seu-usuario/chronos-app.git"
print_info "cd chronos-app"

# 7. Instalar dependências Node
print_info "Instalando dependências do projeto..."
npm ci
print_success "Dependências instaladas"

# 8. Build Next.js
print_info "Fazendo build do Next.js..."
npm run build
print_success "Build completo!"

# 9. Criar arquivo de configuração Nginx
print_info "Configurando Nginx..."
sudo tee /etc/nginx/sites-available/chronos > /dev/null <<EOF
upstream chronos_backend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name SEUDOMINIO.COM.BR;

    location / {
        proxy_pass http://chronos_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/chronos /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
print_success "Nginx configurado"

# 10. Configurar SSL com Certbot
print_info "Configurando SSL (HTTPS)..."
print_info "Execute: sudo certbot --nginx -d SEUDOMINIO.COM.BR"

# 11. Criar arquivo de variáveis de ambiente
print_info "Criando arquivo .env.production..."
cat > .env.production <<EOF
DATABASE_URL="postgresql://usuario:senha@localhost:5432/chronos?schema=public"
NEXT_PUBLIC_HOST=https://SEUDOMINIO.COM.BR
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_XXXXX
PORT=3000
EOF
print_success ".env.production criado (edite com suas variáveis reais)"

# 12. Executar migrações Prisma
print_info "Executando migrações do Prisma..."
npx prisma migrate deploy
print_success "Banco de dados migrado"

# 13. Seed (dados iniciais)
print_info "Populando banco com dados iniciais..."
npx prisma db seed
print_success "Dados iniciais inseridos"

# 14. Criar serviço systemd para iniciar automaticamente
print_info "Criando serviço automático..."
sudo tee /etc/systemd/system/chronos.service > /dev/null <<EOF
[Unit]
Description=Chronos POS Application
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/chronos-app
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable chronos
sudo systemctl start chronos
print_success "Serviço Chronos criado e iniciado"

# 15. Configurar Firewall
print_info "Configurando firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
print_success "Firewall configurado"

echo ""
print_success "✨ Deploy completo! Seu app está rodando!"
echo ""
print_info "Próximos passos:"
echo "1. Edite .env.production com suas variáveis reais"
echo "2. Configure SSL: sudo certbot --nginx -d SEUDOMINIO.COM.BR"
echo "3. Acesse: https://SEUDOMINIO.COM.BR"
echo "4. Monitore logs: sudo journalctl -u chronos -f"
echo ""
