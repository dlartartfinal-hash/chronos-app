# 🚀 Deployment do Chronos POS - Oracle Cloud

Guia completo para fazer deploy na Oracle Cloud.

## 📋 Pré-requisitos

- [ ] Conta Oracle Cloud criada e ativa
- [ ] VM Ubuntu 24.04 pronta
- [ ] IP público da VM
- [ ] Domínio registrado (opcional, mas recomendado)
- [ ] Acesso SSH na VM

## 🎯 Passo 1: Preparar Oracle Cloud VM

### 1.1 Criar VM Ubuntu

```bash
# No Dashboard Oracle Cloud:
# 1. Compute → Instances → Create Instance
# 2. Image: Ubuntu 24.04 Minimal
# 3. Region: São Paulo (SP)
# 4. Shape: Ampere (1 OCPU, 1GB RAM) - GRÁTIS
# 5. Create
```

### 1.2 Permitir tráfego HTTP/HTTPS

```bash
# No Dashboard:
# 1. Compute → Instances → Sua VM
# 2. Primary VNIC → Security Lists
# 3. Adicione regras:
#    - Ingress: Port 80 (HTTP)
#    - Ingress: Port 443 (HTTPS)
#    - Ingress: Port 22 (SSH)
```

## 🔐 Passo 2: Acessar VM via SSH

```bash
# No seu PC Windows/Mac/Linux
ssh ubuntu@SEU_IP_PUBLICO

# Primeira vez, será pedido para aceitar a chave
# Digite: yes
```

## 📦 Passo 3: Clonar o Projeto

```bash
# Na VM
cd ~
git clone https://github.com/SEU_USUARIO/chronos-app.git
cd chronos-app
```

## 🚀 Passo 4: Executar Script de Deploy

```bash
# Na VM, na pasta do projeto
bash deploy.sh
```

Este script irá:
- ✅ Atualizar o sistema
- ✅ Instalar Node.js 20
- ✅ Instalar PostgreSQL
- ✅ Instalar Nginx
- ✅ Instalar Certbot (SSL)
- ✅ Fazer build do Next.js
- ✅ Configurar Nginx como reverse proxy
- ✅ Criar serviço systemd
- ✅ Configurar firewall

## 🔑 Passo 5: Configurar Variáveis de Ambiente

```bash
# Edite o arquivo .env.production
nano .env.production
```

Substitua os valores:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/chronos?schema=public"
NEXT_PUBLIC_HOST=https://seudominio.com.br
STRIPE_SECRET_KEY=sk_live_XXXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXX
```

Salve com: `Ctrl+X → Y → Enter`

## 🔒 Passo 6: Configurar SSL (HTTPS)

```bash
# Execute Certbot
sudo certbot --nginx -d seudominio.com.br

# Responda as perguntas:
# - Email: seu@email.com
# - Termos: (A)gree
# - Compartilhar email: (N)o
```

## 📊 Passo 7: Verificar Banco de Dados

```bash
# Na VM, acesse PostgreSQL
sudo -u postgres psql

# Crie database
CREATE DATABASE chronos;
CREATE USER chronos_user WITH PASSWORD 'senha_segura';
ALTER ROLE chronos_user SET client_encoding TO 'utf8';
ALTER ROLE chronos_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE chronos_user SET default_transaction_deferrable TO on;
ALTER ROLE chronos_user SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE chronos TO chronos_user;
\q

# Depois atualize .env.production com:
# DATABASE_URL="postgresql://chronos_user:senha_segura@localhost:5432/chronos?schema=public"
```

## 🔄 Passo 8: Executar Migrações

```bash
# Na VM, pasta do projeto
npx prisma migrate deploy
npx prisma db seed
```

## ✅ Passo 9: Iniciar Serviço

```bash
# Inicie o serviço Chronos
sudo systemctl start chronos
sudo systemctl enable chronos

# Verifique se está rodando
sudo systemctl status chronos

# Veja logs
sudo journalctl -u chronos -f
```

## 🌐 Passo 10: Apontar Domínio

Se comprou domínio:

1. Vá ao registrador (Registro.br, GoDaddy, etc)
2. Atualize registros DNS:
   - **A Record**: `seudominio.com.br` → IP_PUBLICO_ORACLE
   - **www**: `www.seudominio.com.br` → IP_PUBLICO_ORACLE

Aguarde propagação DNS (2-24 horas)

## 🧪 Testando

```bash
# Teste o app localmente na VM
curl http://localhost:3000

# Teste via IP público
# No seu PC: http://SEU_IP_PUBLICO:80

# Teste com domínio
# No seu PC: https://seudominio.com.br
```

## 🐛 Troubleshooting

### App não inicia
```bash
# Veja logs
sudo journalctl -u chronos -f

# Reinicie
sudo systemctl restart chronos
```

### Nginx erro
```bash
# Teste config
sudo nginx -t

# Reinicie
sudo systemctl restart nginx
```

### Banco não conecta
```bash
# Teste conexão
psql -U postgres -h localhost -d chronos

# Verifique DATABASE_URL em .env.production
```

### SSL não funciona
```bash
# Renove certificado
sudo certbot renew

# Forçar renovação
sudo certbot renew --force-renewal
```

## 📈 Monitoramento

```bash
# Veja uso de memória/CPU
top

# Veja espaço em disco
df -h

# Veja processo Node
ps aux | grep node

# Reinicie manualmente se precisar
sudo systemctl restart chronos
```

## 🔄 Atualizações Futuras

```bash
# Vá ao diretório do projeto
cd ~/chronos-app

# Puxe as mudanças
git pull

# Reconstrua
npm run build

# Reinicie
sudo systemctl restart chronos
```

## 💾 Backup

```bash
# Faça backup do banco
pg_dump -U chronos_user -h localhost chronos > backup_$(date +%Y%m%d).sql

# Restaure se necessário
psql -U chronos_user -h localhost chronos < backup_20231124.sql
```

## 🆘 Suporte

Se tiver problemas:
1. Verifique logs: `sudo journalctl -u chronos -f`
2. Teste conectividade: `curl http://localhost:3000`
3. Verifique variáveis de ambiente: `cat .env.production`

---

**Tudo pronto!** Seu Chronos POS está em produção! 🎉
