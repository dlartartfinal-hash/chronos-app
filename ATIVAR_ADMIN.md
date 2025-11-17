# 🔐 Ativar Acesso Admin

## Passo 1: Aguardar Deploy
Aguarde 1-2 minutos para o Vercel fazer o deploy das mudanças.

## Passo 2: Ativar Admin para seu Email

Execute este comando no PowerShell (substitua SEU_PIN pelo PIN que você configurou):

```powershell
$body = @{
    email = "farias1196@gmail.com"
    ownerPin = "SEU_PIN_AQUI"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://chronos-app-omega.vercel.app/api/admin/grant-access" -Method POST -Body $body -ContentType "application/json"
```

**Exemplo:**
```powershell
$body = @{
    email = "farias1196@gmail.com"
    ownerPin = "1234"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://chronos-app-omega.vercel.app/api/admin/grant-access" -Method POST -Body $body -ContentType "application/json"
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Permissão de administrador concedida com sucesso"
}
```

## Passo 3: Acessar o Painel Admin

1. Acesse: https://chronos-app-omega.vercel.app/dashboard/admin
2. Faça login com `farias1196@gmail.com`
3. Você verá o painel administrativo completo!

---

## 🎛️ Funcionalidades do Painel Admin:

### 📊 **Dashboard:**
- ✅ Total de usuários cadastrados
- ✅ Assinaturas ativas
- ✅ Receita mensal (MRR)
- ✅ Comissões pendentes de pagamento
- ✅ Total de indicações

### 💰 **Gestão de Comissões:**
- ✅ Lista de comissões pendentes
- ✅ Ver indicador e indicado
- ✅ Valor e plano da comissão
- ✅ **Botão "Aprovar Pagamento"**
  - Marca comissão como PAID
  - Atualiza contador do indicador
  - Registra data do pagamento

### 👥 **Gestão de Usuários:**
- ✅ Lista de todos os usuários
- ✅ Ver plano e status de cada um
- ✅ Data de cadastro
- ✅ Email e nome

---

## 🔒 Segurança:

- ✅ Apenas usuários com `isAdmin = true` podem acessar
- ✅ Redireciona automaticamente se não for admin
- ✅ PIN necessário para conceder acesso admin
- ✅ Logs de todas as ações (aprovações, etc.)

---

## 📝 Fluxo de Pagamento de Comissões:

1. **Cliente contrata plano** → Sistema cria comissão PENDING
2. **Cliente paga 1º mês** → Comissão 1 de 50% criada
3. **Cliente paga 2º mês** → Comissão 2 de 50% criada automaticamente
4. **Você acessa o painel admin**
5. **Clica em "Aprovar Pagamento"**
6. **Faz PIX/transferência para o indicador**
7. **Comissão marcada como PAID** → Sai da lista de pendentes

---

## 🚀 Próximos Passos (Futuro):

Posso adicionar:
- 📧 Notificação por email quando houver comissão pendente
- 📊 Relatórios em PDF/CSV
- 🔍 Filtros avançados (por período, indicador, status)
- 💳 Integração com PIX automático
- 📈 Gráficos de crescimento
- 🎯 Dashboard de cada indicador individual

**Seu painel admin está pronto! É só ativar o acesso e começar a usar.** 🎉
