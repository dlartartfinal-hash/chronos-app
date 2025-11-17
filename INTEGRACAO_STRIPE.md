# 🎯 Integração Stripe - Guia de Configuração

## ✅ O que foi implementado:

### 1. **Banco de Dados**

- ✅ Schema atualizado com campos Stripe
- ✅ Migração aplicada com sucesso
- ✅ Campos adicionados: `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`, `stripeCurrentPeriodEnd`

### 2. **APIs Criadas**

- ✅ `/api/stripe/create-checkout` - Cria sessão de pagamento
- ✅ `/api/stripe/webhook` - Processa eventos do Stripe
- ✅ `/api/stripe/create-portal` - Portal do cliente (gerenciar assinatura)

### 3. **Frontend**

- ✅ Página de assinatura atualizada com botões Stripe
- ✅ Página de sucesso pós-pagamento
- ✅ Botão "Gerenciar Assinatura" (acessa portal Stripe)

---

## 🔑 Configuração Necessária (IMPORTANTE!)

### Passo 1: Criar conta no Stripe

1. Acesse: https://dashboard.stripe.com/register
2. Crie sua conta com CNPJ

### Passo 2: Obter chaves da API

1. Acesse: https://dashboard.stripe.com/test/apikeys
2. Copie as chaves de **TEST** (começam com `pk_test_` e `sk_test_`)
3. Cole no arquivo `.env.local`:

```env
# Copie essas chaves do dashboard do Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
STRIPE_SECRET_KEY=sk_test_sua_chave_aqui
```

### Passo 3: Criar produtos no Stripe

1. Acesse: https://dashboard.stripe.com/test/products
2. Clique em **"+ Novo"**

**Produto 1: Chronos Plus**

- Nome: `Chronos Plus`
- Preço mensal: `R$ 49,90`
- Preço anual: `R$ 479,04` (20% desconto)
- Tipo: Recorrente
- ✅ Copie o **Price ID** do plano mensal (ex: `price_1ABC123`)
- ✅ Copie o **Price ID** do plano anual (ex: `price_1ABC456`)

**Produto 2: Chronos Premium**

- Nome: `Chronos Premium`
- Preço mensal: `R$ 99,90`
- Preço anual: `R$ 958,08` (20% desconto)
- Tipo: Recorrente
- ✅ Copie o **Price ID** do plano mensal
- ✅ Copie o **Price ID** do plano anual

3. Adicione os Price IDs no `.env.local`:

```env
# Price IDs dos produtos Stripe
STRIPE_PRICE_PLUS_MONTHLY=price_seu_id_aqui
STRIPE_PRICE_PLUS_YEARLY=price_seu_id_aqui
STRIPE_PRICE_PREMIUM_MONTHLY=price_seu_id_aqui
STRIPE_PRICE_PREMIUM_YEARLY=price_seu_id_aqui
```

### Passo 4: Configurar Webhook (CRÍTICO!)

1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Clique em **"+ Adicionar endpoint"**
3. URL do endpoint: `http://localhost:9002/api/stripe/webhook`
4. Selecione os eventos:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. Copie o **Webhook signing secret** (começa com `whsec_`)
6. Cole no `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_seu_secret_aqui
```

### Passo 5: Testar webhook localmente (Stripe CLI)

Para testar webhooks no localhost, instale o Stripe CLI:

```powershell
# Instalar via Chocolatey
choco install stripe-cli

# Ou baixar: https://github.com/stripe/stripe-cli/releases/latest

# Fazer login
stripe login

# Redirecionar webhooks para seu localhost
stripe listen --forward-to localhost:9002/api/stripe/webhook
```

---

## 🧪 Como Testar

### 1. Iniciar servidor

```powershell
npm run dev
```

### 2. Acessar página de assinatura

- URL: `http://localhost:9002/dashboard/assinatura`

### 3. Clicar em "Assinar Plus" ou "Assinar Premium"

- Você será redirecionado para o checkout do Stripe

### 4. Usar cartão de teste

No checkout, use esses dados de teste:

- **Número do cartão**: `4242 4242 4242 4242`
- **Validade**: Qualquer data futura (ex: 12/25)
- **CVC**: Qualquer 3 dígitos (ex: 123)
- **CEP**: Qualquer (ex: 12345-678)

### 5. Finalizar pagamento

- Após confirmação, você será redirecionado para `/dashboard/assinatura/sucesso`
- O webhook será chamado automaticamente
- Sua assinatura será atualizada no banco

### 6. Verificar assinatura

- Volte para `/dashboard/assinatura`
- Você verá o botão **"Gerenciar Assinatura"**
- Clique para acessar o portal do cliente (cancelar, atualizar cartão, etc)

---

## 🎯 Fluxo Completo

### Trial de 30 dias:

1. **Usuário se cadastra** → Status: `TRIAL`
2. **Usuário escolhe plano pago** → Redireciona para checkout Stripe
3. **Checkout concluído** → Status continua `TRIAL` (30 dias grátis)
4. **Após 30 dias** → Stripe cobra automaticamente → Status: `ACTIVE`
5. **Se pagamento falhar** → Status: `EXPIRED`
6. **Usuário cancela** → Status: `CANCELLED` (acesso até fim do período pago)

### Webhooks importantes:

- `checkout.session.completed` → Cria subscription no banco
- `customer.subscription.updated` → Atualiza status (TRIAL → ACTIVE)
- `invoice.payment_succeeded` → Confirma pagamento (ACTIVE)
- `invoice.payment_failed` → Marca como expirado (EXPIRED)
- `customer.subscription.deleted` → Cancela assinatura (CANCELLED)

---

## 🚀 Próximos Passos

### Para VPS (Produção):

1. **Trocar chaves de TEST para LIVE**

   - Acesse: https://dashboard.stripe.com/apikeys
   - Copie as chaves **LIVE** (começam com `pk_live_` e `sk_live_`)
   - Atualize `.env.production`

2. **Atualizar webhook URL**

   - URL: `https://seu-dominio.com/api/stripe/webhook`
   - Eventos: os mesmos de teste

3. **Ativar conta Stripe**
   - Complete verificação de identidade
   - Adicione informações bancárias para receber pagamentos

---

## 📊 Monitoramento

### Dashboard do Stripe:

- **Pagamentos**: https://dashboard.stripe.com/payments
- **Assinaturas**: https://dashboard.stripe.com/subscriptions
- **Webhooks**: https://dashboard.stripe.com/webhooks
- **Logs**: https://dashboard.stripe.com/logs

---

## ⚠️ Importante:

1. **NUNCA commite** as chaves do Stripe (`.env.local` está no `.gitignore`)
2. **Use modo TEST** enquanto desenvolver
3. **Teste webhooks** com Stripe CLI antes de subir para produção
4. **Monitore logs** do Stripe para detectar problemas

---

## 🆘 Troubleshooting

### Webhook não está funcionando:

```powershell
# Verificar se está recebendo eventos
stripe listen --forward-to localhost:9002/api/stripe/webhook

# Testar webhook manualmente
stripe trigger checkout.session.completed
```

### Status não atualiza:

- Verifique logs do webhook no terminal
- Acesse: https://dashboard.stripe.com/webhooks
- Clique no webhook → Veja eventos recebidos

### Erro ao criar checkout:

- Verifique se os Price IDs estão corretos no `.env.local`
- Confirme que os produtos existem no Stripe

---

**Status**: ✅ Integração completa! Falta apenas configurar as chaves do Stripe.
