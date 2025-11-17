# 📋 Tarefas Pendentes - Chronos

## ✅ CONCLUÍDO: Migração de Promoções para Banco de Dados

**Data**: 2025-01-13  
**Status**: ✅ MIGRAÇÃO COMPLETA

Promoções migradas do localStorage para banco de dados SQLite.

- ✅ API `/api/promotions` criada (GET, POST, DELETE)
- ✅ `PromotionContext` atualizado para usar API
- ✅ Cálculo de status (Ativa/Agendada/Expirada) mantido
- ✅ Página de promoções funcionando com async/await

📄 **Ver detalhes**: `MIGRACAO_PROMOCOES.md`

---

## ✅ CONCLUÍDO: Migração de Configurações para Banco de Dados

**Data**: 2025-01-13  
**Status**: ✅ MIGRAÇÃO COMPLETA

Todas as configurações (cores, logo, taxas de pagamento) foram migradas do localStorage para o banco de dados SQLite.

📄 **Ver detalhes**: `MIGRACAO_CONFIGURACOES.md`

---

## ✅ CONCLUÍDO: Migração de Transações Financeiras para Banco de Dados

**Data**: 2025-01-13  
**Status**: ✅ MIGRAÇÃO COMPLETA

Transações financeiras (despesas manuais) migradas do localStorage para banco de dados SQLite.

- ✅ Tabela `FinancialTransaction` criada no schema
- ✅ API `/api/financial-transactions` criada (GET, POST, DELETE)
- ✅ Página de Finanças atualizada para usar banco de dados
- ✅ Valores armazenados em centavos (int) no banco
- ✅ Removida dependência de localStorage

📄 **Ver detalhes**: `MIGRACAO_TRANSACOES_FINANCEIRAS.md`

---

## ✅ CONCLUÍDO: Configuração de Recibo

**Data**: 2025-01-14  
**Status**: ✅ IMPLEMENTADO

- ✅ UI criada em Configurações com campos: Nome, CNPJ (com máscara), Telefone (com máscara), Endereço
- ✅ PrintableReceipt atualizado para usar dados do banco
- ✅ Salvamento via API `/api/settings`

---

## ✅ CONCLUÍDO: Limpeza de Código

**Data**: 2025-01-14  
**Status**: ✅ COMPLETO

- ✅ Removidos logs de debug do dashboard e APIs
- ✅ Mantidos apenas console.error para produção

---

## ✅ CONCLUÍDO: Testes de Validação

**Data**: 2025-01-14  
**Status**: ✅ TESTADO

- ✅ Fluxo completo do PDV (adicionar items, promoções, múltiplos pagamentos, finalizar)
- ✅ Teste mobile em todas as páginas
- ✅ Isolamento de dados entre contas validado
- ✅ Impressão de recibo com dados do banco

---

## 🔐 Segurança - CRÍTICO para VPS

- [ ] **Implementar JWT** (substituir autenticação por header)
- [ ] **Adicionar validação de input com Zod**
- [ ] **Rate limiting nas APIs**
- [ ] **Configurar variáveis de ambiente**

---

## 📦 Migrações Pendentes

- [x] ✅ **PromotionContext** para API (CONCLUÍDO 13/01/2025)
- [x] ✅ **Transações Financeiras** para API (CONCLUÍDO 13/01/2025)
- [ ] **SubscriptionContext** para API (Baixa prioridade)

---

## 🎨 Melhorias de UX (Opcional - Pós-MVP)

- [x] Botões modo vendedor apenas ícone em mobile
- [x] Título "PDV" em mobile, "Ponto de Venda" em desktop
- [x] Configurações com accordion (5 seções comprimíveis)
- [ ] Adicionar feedback visual em operações (loading states)
- [ ] Melhorar responsividade de tabelas
- [ ] Confirmação de exclusão em operações DELETE

---

_Última atualização: 14/01/2025_
