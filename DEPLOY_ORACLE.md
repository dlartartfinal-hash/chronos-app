# Deployment no Oracle Cloud

## Status da VM

✅ **VM conectada com sucesso**

- **IP Público:** 163.176.216.142
- **Usuário:** ubuntu
- **Localização:** São Paulo, Brasil
- **SO:** Ubuntu 24.04 LTS
- **Conectividade:** ✅ Testada

## Próximas Etapas

Como o repositório no GitHub não está sendo clonado (pode ser privado), vamos fazer upload dos arquivos localmente.

### 1. Fazer Upload do Projeto (do seu PC para VM)

Execute no PowerShell na pasta do projeto:

```powershell
# Compactar o projeto
Compress-Archive -Path "C:\Users\danie\Documents\appp chronos" -DestinationPath "C:\temp\chronos.zip" -Force

# Fazer upload para VM
scp -i "C:\Users\danie\Downloads\ssh-key-2025-11-24.key" "C:\temp\chronos.zip" ubuntu@163.176.216.142:~/chronos.zip

# Descompactar na VM
ssh -i "C:\Users\danie\Downloads\ssh-key-2025-11-24.key" ubuntu@163.176.216.142 "cd ~ && unzip -q chronos.zip && mv 'appp chronos' chronos && cd chronos && ls -la"
```

### 2. Instalar Dependências na VM

```powershell
ssh -i "C:\Users\danie\Downloads\ssh-key-2025-11-24.key" ubuntu@163.176.216.142 "cd ~/chronos && npm install"
```

### 3. Configurar Variáveis de Ambiente

```powershell
# Criar arquivo .env.production na VM
ssh -i "C:\Users\danie\Downloads\ssh-key-2025-11-24.key" ubuntu@163.176.216.142 @'
cat > ~/chronos/.env.production << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_HOST=http://163.176.216.142:3000
DATABASE_URL=postgresql://user:password@localhost:5432/chronos_db
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_PUBLIC_KEY=your_stripe_public_key
EOF
'@
```

### 4. Build da Aplicação

```powershell
ssh -i "C:\Users\danie\Downloads\ssh-key-2025-11-24.key" ubuntu@163.176.216.142 "cd ~/chronos && npm run build"
```

### 5. Criar Serviço Systemd

```powershell
ssh -i "C:\Users\danie\Downloads\ssh-key-2025-11-24.key" ubuntu@163.176.216.142 @'
sudo bash << 'EOF'
cat > /etc/systemd/system/chronos.service << 'SVCEOF'
[Unit]
Description=Chronos POS App
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/chronos
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable chronos
systemctl start chronos
systemctl status chronos
EOF
'@
```

### 6. Instalar e Configurar Nginx (Reverse Proxy)

```powershell
ssh -i "C:\Users\danie\Downloads\ssh-key-2025-11-24.key" ubuntu@163.176.216.142 @'
sudo bash << 'EOF'
apt install -y nginx

cat > /etc/nginx/sites-available/default << 'NGXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGXEOF

systemctl restart nginx
systemctl status nginx
EOF
'@
```

## Acessar a Aplicação

Após completar os passos acima, acesse:

```
http://163.176.216.142
```

## Troubleshooting

### Ver logs da aplicação:

```powershell
ssh -i "C:\Users\danie\Downloads\ssh-key-2025-11-24.key" ubuntu@163.176.216.142 "sudo journalctl -u chronos -f"
```

### Ver logs do Nginx:

```powershell
ssh -i "C:\Users\danie\Downloads\ssh-key-2025-11-24.key" ubuntu@163.176.216.142 "sudo tail -f /var/log/nginx/error.log"
```

### Reiniciar aplicação:

```powershell
ssh -i "C:\Users\danie\Downloads\ssh-key-2025-11-24.key" ubuntu@163.176.216.142 "sudo systemctl restart chronos"
```

---

## Próximas Etapas (Após Deploy)

1. ✅ Fazer upload dos arquivos
2. ✅ Instalar dependências
3. ✅ Configurar variáveis de ambiente
4. ✅ Build da aplicação
5. ✅ Configurar Nginx
6. ⏳ Instalar PostgreSQL (se necessário)
7. ⏳ Configurar SSL/HTTPS com Certbot
8. ⏳ Registrar domínio e apontar DNS
