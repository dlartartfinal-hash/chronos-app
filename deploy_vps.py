#!/usr/bin/env python3
import paramiko
import sys

# Credenciais
host = "82.29.56.11"
port = 22
username = "root"
password = "q)H?AH3&vdESmcJ"

# Conectar via SSH
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print(f"[+] Conectando em {host}...")
    ssh.connect(host, port=port, username=username, password=password, timeout=30)
    print("[+] Conectado com sucesso!")
    
    commands = [
        "cd /root/chronos-prod",
        "npm install",
        "cat > .env.production << 'EOF'\nDATABASE_URL=\"postgresql://chronos_user:chronos123456@localhost:5432/chronos_db\"\nNEXT_PUBLIC_HOST=\"https://82.29.56.11\"\nNODE_ENV=\"production\"\nEOF",
        "npx prisma migrate deploy || true",
        "npm run build",
        "npm install -g pm2 || true",
        "pm2 delete chronos || true",
        "pm2 start npm --name \"chronos\" -- start",
        "pm2 save",
        "pm2 status",
    ]
    
    for cmd in commands:
        print(f"\n[*] Executando: {cmd[:60]}...")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        output = stdout.read().decode()
        error = stderr.read().decode()
        
        if output:
            print(f"[OUT] {output[:200]}")
        if error and "npm notice" not in error:
            print(f"[ERR] {error[:200]}")
    
    print("\n[+] Deploy concluído!")
    ssh.close()
    
except Exception as e:
    print(f"[!] Erro: {e}")
    sys.exit(1)
