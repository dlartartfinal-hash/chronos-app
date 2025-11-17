# 🔍 REVISÃO DE CÓDIGO - Pré-Testes

**Data:** 13 de novembro de 2025  
**Status:** Migração de Contexts para API em andamento

---

## ✅ O QUE ESTÁ FUNCIONANDO

### 1. **Autenticação** ✅

- ✅ Login funcional com bcrypt
- ✅ Registro de usuários
- ✅ API `/api/auth/login` retorna 200
- ✅ Validação de senha funcionando
- ✅ Usuário no banco: `admin@localhost.com` / `123456`
- ⚠️ **PROBLEMA:** Autenticação por header (x-user-email) é insegura - falta JWT

### 2. **Banco de Dados** ✅

- ✅ SQLite funcionando (`dev.db`)
- ✅ Prisma Client gerado
- ✅ Migrações aplicadas
- ✅ Seed executado com sucesso
- ✅ Dados de teste disponíveis

### 3. **Contexts Migrados para API** ✅

- ✅ **CustomerContext** - 100% migrado, usando `/api/customers`
- ✅ **SalesContext** - 100% migrado, usando `/api/sales`
- ✅ **InventoryContext** - 100% migrado HOJE, usando 4 APIs:
  - `/api/products` (GET, POST, PUT, DELETE)
  - `/api/services` (GET, POST, PUT, DELETE)
  - `/api/categories` (GET, POST, PUT, DELETE)
  - `/api/collaborators` (GET, POST, PUT, DELETE)

### 4. **APIs REST Criadas** ✅

Todas as APIs seguem o padrão:

- ✅ Validação de `x-user-email` header
- ✅ Busca do usuário no banco
- ✅ Operações CRUD completas
- ✅ Retorno de erros padronizado
- ✅ Prisma Client integrado

**APIs Disponíveis:**

```
GET    /api/customers          - Listar clientes
POST   /api/customers          - Criar cliente
PUT    /api/customers          - Atualizar cliente
DELETE /api/customers?id={}    - Deletar cliente

GET    /api/sales              - Listar vendas
POST   /api/sales              - Criar venda com itens
PUT    /api/sales              - Atualizar status da venda

GET    /api/products           - Listar produtos + variações
POST   /api/products           - Criar produto + variações
PUT    /api/products           - Atualizar produto + variações
DELETE /api/products?id={}     - Deletar produto

GET    /api/services           - Listar serviços
POST   /api/services           - Criar serviço
PUT    /api/services           - Atualizar serviço
DELETE /api/services?id={}     - Deletar serviço

GET    /api/categories         - Listar categorias
POST   /api/categories         - Criar categoria
PUT    /api/categories         - Atualizar categoria
DELETE /api/categories?id={}   - Deletar categoria

GET    /api/collaborators      - Listar colaboradores
POST   /api/collaborators      - Criar colaborador
PUT    /api/collaborators      - Atualizar colaborador
DELETE /api/collaborators?id={}  - Deletar colaborador

POST   /api/auth/login         - Login com email/senha
POST   /api/user               - Registro de usuário
```

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 1. **Erros de TypeScript (Não-Bloqueantes)** ⚠️

**Arquivo:** `src/app/dashboard/pdv/page.tsx`

**Problema:** O tipo `Item` não inclui propriedades de `Product` como `hasVariations`, `variations`, `sku`, etc.

```typescript
// Linha 79 - Definição atual
type Item = (Product | Service) & { type: "product" | "service" };

// PROBLEMA: Quando o código tenta acessar item.hasVariations,
// TypeScript não reconhece porque Item pode ser Service também
```

**Locais afetados:**

- Linha 107, 111: `item.hasVariations`
- Linha 108, 112: `item.variations`
- Linha 144: `item.hasVariations`
- Linha 243, 270: `item.hasVariations`
- Linha 245: `item.sku` e `item.code`
- Linha 271: Type mismatch ao passar `Item` para `setItemForVariationSelection()`

**Impacto:**

- ❌ Compilador TypeScript reclama
- ✅ Aplicação funciona em runtime (os tipos existem)
- ⚠️ Pode causar bugs futuros se não corrigido

**Solução Recomendada:**

```typescript
// Criar type guards
function isProduct(item: Item): item is Product & { type: "product" } {
  return item.type === "product";
}

function isService(item: Item): item is Service & { type: "service" } {
  return item.type === "service";
}

// Usar nos ifs
if (isProduct(item) && item.hasVariations) {
  // TypeScript agora sabe que item é Product
}
```

### 2. **Conversão Centavos ↔ Reais** ⚠️

**Status:** Implementado mas precisa de testes

**Contexto:** APIs armazenam valores em centavos, mas o app usa decimais.

**Transformações no InventoryContext:**

```typescript
// API → App (refreshInventory)
price: p.priceCents / 100; // 35000 → 350.00
cost: p.costCents / 100; // 28000 → 280.00

// App → API (addProduct, updateProduct)
priceCents: Math.round((product.price || 0) * 100); // 350.00 → 35000
costCents: Math.round((product.cost || 0) * 100); // 280.00 → 28000
```

**Pontos de Atenção:**

- ⚠️ Testar valores com centavos (R$ 10,99 → 1099)
- ⚠️ Testar valores zerados
- ⚠️ Testar produtos com variações
- ⚠️ Verificar arredondamento (Math.round)

### 3. **Deduct Stock Ainda é Local** ⚠️

**Arquivo:** `src/context/inventory-context.tsx` (linhas ~335-360)

```typescript
const deductStock = useCallback((items: CartItem[]) => {
  setProducts((prevProducts) => {
    // Atualiza estado local, mas não sincroniza com API
    return prevProducts.map((product) => {
      // ... atualiza stock localmente
    });
  });
}, []);
```

**Problema:**

- Stock é deduzido apenas no estado React
- Não persiste no banco de dados
- Se recarregar a página, o stock volta ao valor antigo

**Solução Futura:**

- Criar endpoint `PUT /api/products/deduct-stock`
- Chamar API após dedução local
- Ou chamar `refreshInventory()` após venda finalizada

### 4. **Category: Nome vs ID** ⚠️

**Inconsistência de Dados**

**No Banco:**

```sql
Product {
  categoryId: "uuid-123"
  category: { id: "uuid-123", name: "Eletrônicos" }
}
```

**No Context (após transformação):**

```typescript
Product {
  category: "Eletrônicos"  // Só o nome
  categoryId: "uuid-123"   // UUID
}
```

**No addProduct/updateProduct:**

```typescript
const categoryObj = categories.find((c) => c.name === product.category);
const payload = {
  categoryId: categoryObj?.id || null, // Busca pelo nome
};
```

**Risco:**

- Se duas categorias tiverem o mesmo nome → bug
- Melhor seria sempre usar `categoryId` no Product

### 5. **Logs de Debug Ativos** 🔍

**Arquivo:** `src/app/api/auth/login/route.ts`

```typescript
console.log("Login attempt:", { email, passwordLength: password?.length });
console.log("User found:", user.email, "hash:", user.password);
console.log("Password validation result:", isPasswordValid);
```

**Ação:** Remover antes de produção (VPS)

---

## ❌ CONTEXTS AINDA NÃO MIGRADOS

### 1. **PromotionContext** ❌

- ❌ Ainda usando localStorage
- ❌ Sem API criada
- ❌ Precisa de migração completa

**Prioridade:** MÉDIA (não é crítico para teste básico)

### 2. **SubscriptionContext** ❌

- ❌ Ainda usando localStorage
- ❌ Sem API criada
- ❌ Relacionado a planos/assinaturas

**Prioridade:** BAIXA (funcionalidade futura)

### 3. **SellerModeContext** ✅

- ✅ Usa localStorage mas é intencional (estado de sessão)
- ✅ Não precisa de API

### 4. **UserContext** ⚠️

- ⚠️ Usa localStorage para persistir usuário logado
- ⚠️ Deveria usar cookies/session após implementar JWT
- ⚠️ API `/api/user` existe para registro

---

## 🔒 SEGURANÇA - ISSUES CRÍTICOS

### 1. **Autenticação Insegura** 🚨

**Problema Atual:**

```typescript
// Em apiRequest (src/lib/api.ts)
const userEmail = localStorage.getItem("app_user")
  ? JSON.parse(localStorage.getItem("app_user")!).email
  : null;

const headers = {
  "x-user-email": userEmail, // ❌ QUALQUER UM PODE FALSIFICAR
};
```

**Risco:**

- ❌ Usuário pode modificar localStorage
- ❌ Pode passar qualquer email no header
- ❌ Pode acessar dados de outros usuários

**Solução Obrigatória antes de VPS:**

1. Implementar JWT (jsonwebtoken)
2. Login retorna token
3. Token enviado via `Authorization: Bearer <token>`
4. APIs validam token em vez de email
5. Token armazena userId criptografado

### 2. **Senhas Expostas em Logs** 🚨

```typescript
console.log("User found:", user.email, "hash:", user.password);
```

❌ Nunca logar hashes de senha (mesmo criptografados)

### 3. **Sem Rate Limiting** ⚠️

- APIs não têm proteção contra força bruta
- Login pode ser atacado

### 4. **Sem Validação de Input** ⚠️

APIs aceitam qualquer dado sem validação Zod/Joi

---

## 📊 STATUS DA MIGRAÇÃO

```
┌─────────────────────────────────────────┐
│ MIGRAÇÃO LOCALSTORAGE → SQL DATABASE    │
├─────────────────────────────────────────┤
│ ✅ Users (auth)           100%          │
│ ✅ Customers              100%          │
│ ✅ Sales                  100%          │
│ ✅ Products               100%          │
│ ✅ Services               100%          │
│ ✅ Categories             100%          │
│ ✅ Collaborators          100%          │
│ ❌ Promotions               0%          │
│ ❌ Subscriptions            0%          │
├─────────────────────────────────────────┤
│ PROGRESSO TOTAL:           78%          │
└─────────────────────────────────────────┘
```

---

## 🧪 CHECKLIST DE TESTES

### **FASE 1: Testes Básicos**

- [ ] Login/Logout funciona
- [ ] Dashboard carrega sem erros
- [ ] Navegação entre páginas funciona

### **FASE 2: Clientes**

- [ ] Listar clientes existentes
- [ ] Criar novo cliente
- [ ] Editar cliente
- [ ] Deletar cliente
- [ ] Buscar cliente

### **FASE 3: Produtos**

- [ ] Listar produtos
- [ ] Criar produto simples (sem variações)
- [ ] Criar produto com variações
- [ ] Editar produto
- [ ] Deletar produto
- [ ] Verificar conversão de preços (centavos ↔ reais)

### **FASE 4: Serviços**

- [ ] Listar serviços
- [ ] Criar serviço
- [ ] Editar serviço
- [ ] Deletar serviço

### **FASE 5: Categorias**

- [ ] Listar categorias
- [ ] Criar categoria
- [ ] Editar categoria
- [ ] Deletar categoria (verificar se bloqueia se tem produtos)

### **FASE 6: Colaboradores**

- [ ] Listar colaboradores
- [ ] Criar colaborador
- [ ] Editar colaborador
- [ ] Mudar status (Ativo/Inativo)
- [ ] Deletar colaborador

### **FASE 7: Vendas (PDV)**

- [ ] Adicionar produto ao carrinho
- [ ] Adicionar serviço ao carrinho
- [ ] Selecionar variação de produto
- [ ] Adicionar cliente à venda
- [ ] Finalizar venda
- [ ] **CRÍTICO:** Verificar se stock é deduzido
- [ ] Verificar se venda aparece em "Vendas"

### **FASE 8: Relatórios**

- [ ] Dados carregam do banco
- [ ] Gráficos renderizam
- [ ] Filtros funcionam

---

## 🚀 PRÓXIMOS PASSOS

### **Antes dos Testes:**

1. ✅ Remover logs de debug do login
2. ⚠️ Corrigir tipos TypeScript do PDV (opcional)
3. ✅ Verificar se servidor está rodando

### **Durante os Testes:**

1. Monitorar terminal para erros
2. Verificar console do navegador
3. Testar cada CRUD completamente

### **Após os Testes:**

1. Migrar PromotionContext
2. Implementar JWT
3. Adicionar validação Zod nas APIs
4. Persistir dedução de stock no banco
5. Preparar para deploy no VPS

---

## 📝 NOTAS IMPORTANTES

### **Performance:**

- Cada operação de inventory chama `refreshInventory()`
- São 4 requests paralelos (products, services, categories, collaborators)
- Em produção, considerar cache ou state management mais eficiente

### **Conversão de Dados:**

```typescript
// Banco (Prisma) → API → Context → UI
{
  priceCents: 35000          // Banco
  price: 350.00              // Context
  R$ 350,00                  // UI (formatCurrency)
}
```

### **Relacionamentos:**

- Product → Category (categoryId)
- Product → ProductVariation[] (variations)
- Sale → SaleItem[] (items)
- Sale → Customer (customerId)
- Sale → Collaborator (collaboratorId)

Todos com CASCADE delete configurado no Prisma.

---

## ✅ RESUMO EXECUTIVO

**O QUE FUNCIONA:**

- ✅ Login/Autenticação básica
- ✅ Banco de dados operacional
- ✅ 7 de 9 contexts migrados
- ✅ 10 APIs REST funcionais
- ✅ Servidor rodando sem erros

**O QUE PRECISA DE ATENÇÃO:**

- ⚠️ Erros de tipo TypeScript (não-críticos)
- ⚠️ Segurança (JWT pendente)
- ⚠️ Stock não persiste após dedução
- ⚠️ 2 contexts ainda em localStorage

**PRONTO PARA TESTES:** ✅ SIM
**PRONTO PARA PRODUÇÃO:** ❌ NÃO (falta JWT e validações)

---

**Última atualização:** 13 nov 2025, 13:45 UTC
