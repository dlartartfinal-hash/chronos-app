# 🚀 DEPLOY NO VERCEL - GUIA PASSO A PASSO

## ✅ PRÉ-REQUISITOS

- [v] Git instalado (https://git-scm.com/download/win)
- [v] Conta GitHub (https://github.com)
- [ ] Conta Vercel (https://vercel.com)
- [ ] Conta Neon (PostgreSQL grátis) (https://neon.tech)
- [ ] Stripe configurado (https://stripe.com)

---

## 📋 PASSO 1: SUBIR CÓDIGO PARA GITHUB (5 min)

### 1.1 - Inicializar Git:

```powershell
cd "c:\Users\danie\Desktop\appp chronos"
git init
git add .
git commit -m "Initial commit - Chronos App"
```

### 1.2 - Criar Repositório no GitHub:

1. Acesse: https://github.com/new
2. Nome: `chronos-app`
3. Visibilidade: **Private** (recomendado)
4. Clique em **Create repository**

### 1.3 - Conectar e Enviar:

```powershell
git remote add origin https://github.com/SEU-USUARIO/chronos-app.git
git branch -M main
git push -u origin main
```

---

## 📋 PASSO 2: CONFIGURAR BANCO DE DADOS (5 min)

### 2.1 - Criar Banco no Neon:

1. Acesse: https://neon.tech
2. Clique em **Sign Up** (use conta GitHub)
3. Crie novo projeto: `chronos-production`
4. Copie a **Connection String**: `postgresql://user:pass@host/db?sslmode=require`

### 2.2 - Migrar Schema:

```powershell
# Criar arquivo .env.production.local
echo DATABASE_URL="sua-connection-string-aqui" > .env.production.local

# Rodar migrations
npx prisma migrate deploy
```

---

## 📋 PASSO 3: DEPLOY NO VERCEL (3 min)

### 3.1 - Conectar Repositório:

1. Acesse: https://vercel.com
2. Clique em **Add New Project**
3. Selecione seu repositório **chronos-app**
4. Clique em **Import**

### 3.2 - Configurar Variáveis de Ambiente:

Na tela de configuração, adicione:

```env
# Database
DATABASE_URL=sua-connection-string-do-neon

# Stripe (Test Mode por enquanto)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (configurar depois)
NEXT_PUBLIC_STRIPE_KEY=pk_test_...

# App URL
NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
```

### 3.3 - Deploy:

1. Clique em **Deploy**
2. Aguarde ~2 minutos
3. ✅ Seu app estará no ar!

---

## 📋 PASSO 4: CONFIGURAR STRIPE WEBHOOK (5 min)

### 4.1 - Criar Webhook no Stripe:

1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique em **Add endpoint**
3. URL: `https://seu-app.vercel.app/api/stripe/webhook`
4. Eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
5. Copie o **Signing secret** (whsec\_...)

### 4.2 - Atualizar Variável no Vercel:

1. Vercel Dashboard → Seu projeto → Settings → Environment Variables
2. Adicionar: `STRIPE_WEBHOOK_SECRET` = `whsec_...`
3. Redeploy: Overview → ... → Redeploy

---

## 📋 PASSO 5: CRIAR PRODUTOS NO STRIPE (5 min)

### 5.1 - Plano Básico:

1. Acesse: https://dashboard.stripe.com/products
2. Clique em **Add product**
3. Configurar:

   ```
   Name: Chronos - Plano Básico
   Description: Gestão completa para pequenos negócios

   Price (Mensal):
   - Amount: R$ 29.90
   - Billing: Monthly
   - Recurring

   Price (Anual):
   - Amount: R$ 299.00
   - Billing: Yearly
   - Recurring
   ```

### 5.2 - Plano Profissional:

Repetir processo com:

```
Name: Chronos - Plano Profissional
Description: Recursos avançados + suporte prioritário
Mensal: R$ 59.89
Anual: R$ 598.90
```

### 5.3 - Copiar Price IDs:

Você terá 4 IDs:

- `price_xxx` (Básico Mensal)
- `price_yyy` (Básico Anual)
- `price_zzz` (Profissional Mensal)
- `price_www` (Profissional Anual)

### 5.4 - Atualizar no Código:

Edite `src/app/api/stripe/create-checkout/route.ts`:

```typescript
const priceIds: Record<string, Record<string, string>> = {
  Básico: {
    MONTHLY: "price_xxx", // Cole aqui
    YEARLY: "price_yyy", // Cole aqui
  },
  Profissional: {
    MONTHLY: "price_zzz", // Cole aqui
    YEARLY: "price_www", // Cole aqui
  },
};
```

Commit e push:

```powershell
git add .
git commit -m "Add Stripe price IDs"
git push
```

---

## 📋 PASSO 6: TESTAR EM PRODUÇÃO (10 min)

### 6.1 - Criar Conta Teste:

1. Acesse: `https://seu-app.vercel.app`
2. Registre nova conta
3. Verifique trial de 1 dia

### 6.2 - Testar Assinatura:

1. Ir para Assinatura
2. Escolher plano
3. Usar cartão teste: `4242 4242 4242 4242`
4. CVC: qualquer 3 dígitos
5. Data: qualquer futura

### 6.3 - Verificar Webhook:

1. Stripe Dashboard → Webhooks
2. Ver eventos recebidos
3. Status: ✅ Success

---

## 🎉 PRONTO! SEU APP ESTÁ NO AR!

### URLs Importantes:

- **App:** https://seu-app.vercel.app
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Neon Dashboard:** https://console.neon.tech
- **Stripe Dashboard:** https://dashboard.stripe.com

### Próximos Passos:

1. [ ] Executar checklist de testes completo
2. [ ] Convidar beta testers
3. [ ] Coletar feedback
4. [ ] Iterar e melhorar
5. [ ] Lançar oficialmente! 🚀

---

## 🆘 PROBLEMAS COMUNS

### Build falha no Vercel:

```bash
# Verificar build local:
npm run build

# Se passar, commit e push de novo
```

### Erro de conexão com banco:

- Verificar se DATABASE_URL está correta
- Verificar se migrations rodaram: `npx prisma migrate deploy`

### Webhook não funciona:

- Verificar URL no Stripe
- Verificar STRIPE_WEBHOOK_SECRET no Vercel
- Redeploy após adicionar variável

---

## 📞 SUPORTE

Se tiver dúvidas:

1. Verificar logs no Vercel
2. Verificar eventos no Stripe
3. Testar localmente primeiro

**Boa sorte! 🍀**
