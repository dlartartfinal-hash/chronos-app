# 🚨 CORREÇÃO URGENTE - URL de Retorno do Stripe

## Problema Identificado

O Stripe está redirecionando para o domínio **incorreto** após o pagamento:
- ❌ URL Atual (ERRADA): `https://dashboard.synkros.app/dashboard/assinatura/sucesso`
- ✅ URL Correta: `https://chronos-app-omega.vercel.app/dashboard/assinatura/sucesso`

Isso causa erro **404** após o pagamento bem-sucedido, impedindo a ativação da assinatura.

---

## Solução: Configurar Variável de Ambiente no Vercel

### Passo 1: Acessar Configurações do Vercel
1. Acesse: https://vercel.com/fariasmoeda/chronos-app/settings/environment-variables
2. Faça login se necessário

### Passo 2: Verificar/Adicionar a Variável

Procure por `NEXT_PUBLIC_APP_URL`:

#### Se a variável EXISTE com valor errado:
1. Clique no ícone de **3 pontinhos** ao lado dela
2. Clique em **Edit**
3. Altere o valor para: `https://chronos-app-omega.vercel.app`
4. Clique em **Save**

#### Se a variável NÃO EXISTE:
1. Clique em **Add New**
2. Preencha:
   - **Key:** `NEXT_PUBLIC_APP_URL`
   - **Value:** `https://chronos-app-omega.vercel.app`
   - **Environments:** Marque **Production**, **Preview** e **Development**
3. Clique em **Save**

### Passo 3: Redeploy da Aplicação

Após salvar a variável, você precisa fazer um redeploy:

**Opção A - Redeploy Manual:**
1. Vá para: https://vercel.com/fariasmoeda/chronos-app/deployments
2. Clique nos **3 pontinhos** do último deployment
3. Clique em **Redeploy**
4. Confirme clicando em **Redeploy** novamente

**Opção B - Fazer novo commit (automático):**
```bash
git commit --allow-empty -m "chore: trigger redeploy to update env vars"
git push
```

---

## Verificação

Após o redeploy (aguarde 1-2 minutos), teste novamente:

1. Acesse: https://chronos-app-omega.vercel.app/dashboard/assinatura
2. Clique em **Assinar Profissional**
3. Preencha os dados de teste do Stripe:
   - Cartão: `4242 4242 4242 4242`
   - Data: Qualquer data futura
   - CVC: `424`
4. Clique em **Subscribe**
5. ✅ **Você deve ser redirecionado para a página de sucesso** (não mais 404!)
6. A assinatura será ativada automaticamente

---

## Como Funciona Agora

Com a correção implementada no último commit:

1. **Stripe processa o pagamento** ✅
2. **Redireciona para página de sucesso** com `session_id` ✅
3. **Página de sucesso chama `/api/stripe/verify-session`** ✅
4. **API busca dados da sessão no Stripe** ✅
5. **API cria/atualiza subscription no banco imediatamente** ✅
6. **Usuário vê mensagem de sucesso com plano ativo** ✅

Não depende mais de webhook para ativação inicial!

---

## Outras Variáveis Necessárias

Aproveite para verificar se essas variáveis também estão configuradas no Vercel:

### Stripe (Obrigatórias):
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (opcional, mas recomendado)
```

### Preços do Stripe:
```
STRIPE_PRICE_BASICO_MONTHLY_ID=price_...
STRIPE_PRICE_BASICO_YEARLY_ID=price_...
STRIPE_PRICE_PROFISSIONAL_MONTHLY_ID=price_...
STRIPE_PRICE_PROFISSIONAL_YEARLY_ID=price_...
```

Se faltarem essas, configure também. Você encontra os IDs no Stripe Dashboard em: https://dashboard.stripe.com/test/products

---

## Status Atual

✅ Código corrigido e deployed  
⏳ Aguardando configuração de `NEXT_PUBLIC_APP_URL` no Vercel  
⏳ Aguardando redeploy  

Depois de configurar, teste e me avise se funcionou! 🚀
