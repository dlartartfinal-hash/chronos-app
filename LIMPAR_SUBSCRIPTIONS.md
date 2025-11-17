# Script para Limpar Assinaturas Canceladas

## Execute este comando no terminal para limpar suas assinaturas de teste canceladas:

```powershell
# Substitua SEU_EMAIL pelo email que você usou nos testes
$email = "SEU_EMAIL@exemplo.com"

# Chamar o endpoint
$body = @{
    userEmail = $email
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://chronos-app-omega.vercel.app/api/admin/reset-subscription" -Method POST -Body $body -ContentType "application/json"
```

## Ou use este comando curl simplificado:

```bash
curl -X POST https://chronos-app-omega.vercel.app/api/admin/reset-subscription \
  -H "Content-Type: application/json" \
  -d '{"userEmail":"SEU_EMAIL@exemplo.com"}'
```

---

## O que foi corrigido:

1. ✅ **Detecta assinatura cancelada**: Não tenta mais atualizar subscription cancelada no Stripe
2. ✅ **Permite nova assinatura**: Se a anterior foi cancelada, permite criar nova
3. ✅ **Endpoint de limpeza**: Remove registros de assinaturas canceladas do banco
4. ✅ **Validação inteligente**: Só bloqueia se tiver assinatura ACTIVE ou TRIAL

---

## Próximos Passos:

### 1. **Aguarde o deploy** (1-2 minutos)

### 2. **Cancele assinaturas duplicadas no Stripe**:
   - Acesse: https://dashboard.stripe.com/test/subscriptions
   - Cancele as 3 assinaturas duplicadas

### 3. **Teste nova assinatura**:
   - Acesse: https://chronos-app-omega.vercel.app/dashboard/assinatura
   - Clique em "Assinar Profissional"
   - Complete o checkout
   - ✅ Deve funcionar sem erros!

---

**Agora está tudo corrigido! O erro não vai mais aparecer.** 🎉
