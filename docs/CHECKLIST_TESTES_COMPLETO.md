# 📋 Checklist Completo de Testes - Chronos

## 🎯 Objetivo

Este documento contém uma bateria completa e rigorosa de testes para validar todas as funcionalidades do sistema Chronos, incluindo o novo modelo de negócio com **trial obrigatório de 1 dia** antes da assinatura.

## 💡 Modelo de Negócio

- **Trial de 1 Dia:** Todos os novos usuários recebem 1 dia de acesso completo
- **Assinatura Obrigatória:** Após 24 horas, é obrigatório assinar um plano para continuar
- **Sem Plano Gratuito:** Não existe tier gratuito permanente
- **Planos Disponíveis:** Básico, Profissional e Empresarial

---

## 1️⃣ TESTES DE AUTENTICAÇÃO

### 1.1 Registro de Novo Usuário (SEM Indicação)

- [ ] Acessar página de registro
- [ ] Preencher dados mínimos obrigatórios
  - [ ] Nome completo
  - [ ] E-mail válido
  - [ ] Senha (mínimo 6 caracteres)
- [ ] Validar que código de indicação está vazio
- [ ] Clicar em "Criar Conta"
- [ ] ✅ Verificar criação do usuário no banco
- [ ] ✅ Verificar que `trialEndsAt` foi definido (data atual + 1 dia)
- [ ] ✅ Verificar que não há registro em `Referral`
- [ ] ✅ Verificar redirecionamento para `/dashboard`
- [ ] ✅ Verificar que assinatura é NULL (período de trial)

### 1.2 Registro de Novo Usuário (COM Indicação Válida)

- [ ] Obter código de indicação válido (ex: `CHRONOS-12345`)
- [ ] Acessar `/register?ref=CHRONOS-12345`
- [ ] ✅ Verificar que campo de código está preenchido
- [ ] ✅ Verificar que campo está desabilitado (readonly)
- [ ] Preencher dados do usuário
- [ ] Criar conta
- [ ] ✅ Verificar criação do usuário
- [ ] ✅ Verificar criação de registro em `Referral` com:
  - `referrerId` = ID do usuário que indicou
  - `referredId` = ID do novo usuário
  - `status` = `pending`
  - `code` = código usado
- [ ] ✅ Verificar que indicador NÃO recebeu crédito ainda

### 1.3 Registro com Código de Indicação Inválido

- [ ] Acessar `/register?ref=CODIGO-INVALIDO`
- [ ] Tentar criar conta
- [ ] ✅ Verificar mensagem de erro sobre código inválido
- [ ] ✅ Verificar que conta NÃO foi criada

### 1.4 Login

- [ ] Acessar `/login`
- [ ] Tentar login com credenciais incorretas
  - [ ] ✅ Verificar mensagem de erro
- [ ] Fazer login com credenciais corretas
  - [ ] ✅ Verificar redirecionamento para `/dashboard`
  - [ ] ✅ Verificar sessão ativa

### 1.5 Logout

- [ ] Clicar em "Sair" no menu
- [ ] ✅ Verificar redirecionamento para `/login`
- [ ] ✅ Verificar que sessão foi encerrada
- [ ] Tentar acessar `/dashboard` sem login
  - [ ] ✅ Verificar redirecionamento para `/login`

---

## 2️⃣ TESTES DE ASSINATURA (STRIPE)

### 2.1 Usuário em Período de Trial (Sem Assinatura)

- [ ] Logar com usuário sem assinatura (trial ativo)
- [ ] Acessar `/dashboard/assinatura`
- [ ] ✅ Verificar exibição do alerta de trial com contador regressivo
- [ ] ✅ Verificar tempo restante do trial sendo exibido
- [ ] ✅ Verificar exibição dos 3 planos:
  - [ ] Básico
  - [ ] Profissional
  - [ ] Empresarial
- [ ] ✅ Verificar mensagem informando que trial expira em X horas

### 2.2 Contratar Plano Profissional

- [ ] Clicar em "Assinar" no plano Profissional
- [ ] ✅ Verificar redirecionamento para Stripe Checkout
- [ ] Preencher dados de pagamento (usar cartão de teste)
  - Cartão teste: `4242 4242 4242 4242`
  - Validade: qualquer data futura
  - CVV: qualquer 3 dígitos
- [ ] Concluir pagamento
- [ ] ✅ Verificar redirecionamento para `/dashboard/assinatura/sucesso`
- [ ] ✅ Verificar criação de registro em `Subscription`:
  - `userId` correto
  - `plan` = `Profissional`
  - `status` = `active`
  - `stripeSubscriptionId` preenchido
  - `stripeCustomerId` preenchido
  - `currentPeriodEnd` com data futura
- [ ] ✅ Se usuário foi indicado, verificar:
  - [ ] Status do `Referral` mudou para `completed`
  - [ ] Indicador recebeu R$ 50 em créditos
  - [ ] Registro em `FinancialTransaction` com:
    - `type` = `credit`
    - `amount` = 5000 (centavos)
    - `description` = "Bônus indicação"
    - `category` = `referral_bonus`

### 2.3 Atualizar Assinatura (Profissional → Empresarial)

- [ ] Usuário com plano Profissional ativo
- [ ] Acessar `/dashboard/assinatura`
- [ ] Clicar em "Atualizar" no plano Empresarial
- [ ] ✅ Verificar chamada da API `/api/stripe/update-subscription`
- [ ] Confirmar atualização
- [ ] ✅ Verificar atualização do registro `Subscription`:
  - `plan` mudou para `Empresarial`
  - `stripeSubscriptionId` mantido
  - Valores atualizados

### 2.4 Cancelar Assinatura

- [ ] Usuário com assinatura ativa
- [ ] Acessar `/dashboard/assinatura`
- [ ] Clicar em "Gerenciar Assinatura"
- [ ] ✅ Verificar redirecionamento para Stripe Portal
- [ ] Cancelar assinatura no portal
- [ ] Webhook processa cancelamento
- [ ] ✅ Verificar que `status` mudou para `canceled` no banco
- [ ] ✅ Verificar que `currentPeriodEnd` mantém data original
- [ ] Acessar app novamente
- [ ] ✅ Verificar que ainda tem acesso até fim do período

### 2.5 Webhook - Renovação Automática

- [ ] Simular webhook `invoice.payment_succeeded`
- [ ] ✅ Verificar que `currentPeriodEnd` foi atualizado
- [ ] ✅ Verificar que `status` permanece `active`

### 2.6 Webhook - Pagamento Falhou

- [ ] Simular webhook `invoice.payment_failed`
- [ ] ✅ Verificar que `status` mudou para `past_due`
- [ ] ✅ Verificar notificação ao usuário

### 2.7 Sistema de Trial de 1 Dia

#### 2.7.1 Verificação de Trial Ativo

- [ ] Criar novo usuário
- [ ] ✅ Verificar que `trialEndsAt` está definido (agora + 24h)
- [ ] Acessar dashboard
- [ ] ✅ Verificar acesso completo a todas as funcionalidades
- [ ] Acessar `/dashboard/assinatura`
- [ ] ✅ Verificar alerta exibindo tempo restante de trial
- [ ] ✅ Verificar contador regressivo funcionando (atualiza a cada segundo)

#### 2.7.2 Trial Próximo de Expirar (< 1 hora)

- [ ] Modificar `trialEndsAt` no banco para daqui 30 minutos
- [ ] Recarregar dashboard
- [ ] ✅ Verificar alerta com estilo de urgência (amarelo/laranja)
- [ ] ✅ Verificar tempo restante em minutos e segundos
- [ ] ✅ Verificar mensagem incentivando assinatura

#### 2.7.3 Trial Expirado (Sem Assinatura)

- [ ] Modificar `trialEndsAt` no banco para data passada
- [ ] Tentar acessar `/dashboard`
- [ ] ✅ Verificar redirecionamento automático para `/dashboard/assinatura`
- [ ] Tentar acessar outras páginas do dashboard
- [ ] ✅ Verificar que TODAS redirecionam para assinatura
- [ ] ✅ Verificar alerta vermelho informando que trial expirou
- [ ] ✅ Verificar que não consegue acessar funcionalidades

#### 2.7.4 Trial Expirado + Assinatura Ativa

- [ ] Usuário com trial expirado
- [ ] Assinar plano Profissional
- [ ] ✅ Verificar que ganhou acesso imediato
- [ ] ✅ Verificar que não é mais redirecionado
- [ ] ✅ Verificar que `trialEndsAt` permanece no banco (histórico)
- [ ] ✅ Verificar que validação verifica assinatura antes do trial

#### 2.7.5 Assinatura Durante Trial

- [ ] Usuário com trial ativo (ainda não expirou)
- [ ] Assinar plano durante o trial
- [ ] ✅ Verificar que assinatura é criada normalmente
- [ ] ✅ Verificar que alerta de trial desaparece
- [ ] ✅ Verificar que mostra status de assinatura ativa
- [ ] ✅ Verificar que não há mais contador de trial

---

## 3️⃣ TESTES DE PRODUTOS E SERVIÇOS

### 3.1 Criar Produto

- [ ] Acessar `/dashboard/produtos-servicos`
- [ ] Clicar em "Novo Produto"
- [ ] Preencher dados:
  - [ ] Nome
  - [ ] SKU (único)
  - [ ] Descrição
  - [ ] Preço de custo
  - [ ] Preço de venda
  - [ ] Estoque inicial
  - [ ] Categoria
  - [ ] Unidade de medida
- [ ] Salvar
- [ ] ✅ Verificar criação no banco (`Product` com `type = product`)
- [ ] ✅ Verificar que aparece na lista

### 3.2 Criar Produto com SKU Duplicado

- [ ] Tentar criar produto com SKU já existente
- [ ] ✅ Verificar mensagem de erro
- [ ] ✅ Verificar que produto NÃO foi criado

### 3.3 Editar Produto

- [ ] Clicar em produto existente
- [ ] Alterar nome, preço, estoque
- [ ] Salvar
- [ ] ✅ Verificar atualização no banco
- [ ] ✅ Verificar atualização na lista

### 3.4 Criar Serviço

- [ ] Clicar em "Novo Serviço"
- [ ] Preencher dados:
  - [ ] Nome
  - [ ] SKU
  - [ ] Descrição
  - [ ] Preço
  - [ ] Duração estimada
  - [ ] Categoria
- [ ] Salvar
- [ ] ✅ Verificar criação no banco (`Product` com `type = service`)
- [ ] ✅ Verificar que não tem estoque

### 3.5 Excluir Produto/Serviço

- [ ] Selecionar produto/serviço
- [ ] Clicar em "Excluir"
- [ ] Confirmar
- [ ] ✅ Verificar remoção do banco
- [ ] ✅ Verificar remoção da lista

### 3.6 Upload de Imagem

- [ ] Criar/editar produto
- [ ] Fazer upload de imagem
- [ ] ✅ Verificar que imagem foi salva (Firebase Storage)
- [ ] ✅ Verificar que URL está no banco
- [ ] ✅ Verificar exibição da imagem na lista

---

## 4️⃣ TESTES DE CATEGORIAS

### 4.1 Criar Categoria

- [ ] Acessar `/dashboard/categorias`
- [ ] Clicar em "Nova Categoria"
- [ ] Preencher nome e cor
- [ ] Salvar
- [ ] ✅ Verificar criação no banco
- [ ] ✅ Verificar que aparece na lista e nos selects

### 4.2 Editar Categoria

- [ ] Editar nome ou cor
- [ ] Salvar
- [ ] ✅ Verificar atualização
- [ ] ✅ Verificar que produtos vinculados mantêm vínculo

### 4.3 Excluir Categoria com Produtos Vinculados

- [ ] Tentar excluir categoria com produtos
- [ ] ✅ Verificar mensagem de erro ou aviso
- [ ] ✅ Opcionalmente, verificar remoção em cascata

### 4.4 Excluir Categoria Vazia

- [ ] Excluir categoria sem produtos
- [ ] ✅ Verificar remoção do banco
- [ ] ✅ Verificar remoção da lista

---

## 5️⃣ TESTES DE CLIENTES

### 5.1 Criar Cliente

- [ ] Acessar `/dashboard/clientes`
- [ ] Clicar em "Novo Cliente"
- [ ] Preencher:
  - [ ] Nome
  - [ ] E-mail
  - [ ] Telefone
  - [ ] CPF/CNPJ
  - [ ] Endereço
- [ ] Salvar
- [ ] ✅ Verificar criação no banco
- [ ] ✅ Verificar que aparece na lista

### 5.2 Validação de CPF/CNPJ

- [ ] Tentar criar cliente com CPF inválido
- [ ] ✅ Verificar mensagem de erro
- [ ] Criar com CPF válido
- [ ] ✅ Verificar sucesso

### 5.3 Cliente Duplicado (mesmo e-mail)

- [ ] Tentar criar cliente com e-mail já cadastrado
- [ ] ✅ Verificar mensagem de erro ou aviso
- [ ] ✅ Opcionalmente, permitir múltiplos com flag

### 5.4 Editar Cliente

- [ ] Editar dados do cliente
- [ ] Salvar
- [ ] ✅ Verificar atualização
- [ ] ✅ Verificar que vendas antigas mantêm dados

### 5.5 Excluir Cliente

- [ ] Excluir cliente
- [ ] ✅ Verificar remoção ou soft delete
- [ ] ✅ Verificar que vendas antigas mantêm referência

### 5.6 Histórico de Compras do Cliente

- [ ] Abrir detalhes do cliente
- [ ] ✅ Verificar lista de todas as vendas do cliente
- [ ] ✅ Verificar total gasto
- [ ] ✅ Verificar última compra

---

## 6️⃣ TESTES DE VENDAS (PDV)

### 6.1 Venda Simples (1 Produto, Dinheiro)

- [ ] Acessar `/dashboard/pdv`
- [ ] Selecionar cliente
- [ ] Adicionar 1 produto ao carrinho
- [ ] ✅ Verificar cálculo do subtotal
- [ ] Selecionar pagamento "Dinheiro"
- [ ] Finalizar venda
- [ ] ✅ Verificar criação em `Sale`:
  - `customerId` correto
  - `sellerId` = usuário logado
  - `items` com produto e quantidade
  - `paymentMethod` = `cash`
  - `totalAmount` correto
  - `status` = `completed`
- [ ] ✅ Verificar redução do estoque do produto
- [ ] ✅ Verificar criação de `FinancialTransaction`:
  - `type` = `sale`
  - `amount` = valor da venda
  - `category` = `product_sale` ou `service_sale`
  - `saleId` vinculado

### 6.2 Venda com Múltiplos Produtos

- [ ] Adicionar 3+ produtos diferentes
- [ ] Alterar quantidades
- [ ] ✅ Verificar cálculo correto do total
- [ ] Finalizar venda
- [ ] ✅ Verificar que todos os produtos estão em `items`
- [ ] ✅ Verificar redução de estoque de todos

### 6.3 Venda com Desconto Fixo

- [ ] Adicionar produtos
- [ ] Aplicar desconto fixo (ex: R$ 10)
- [ ] ✅ Verificar novo total = subtotal - desconto
- [ ] Finalizar
- [ ] ✅ Verificar que `discountAmount` está salvo
- [ ] ✅ Verificar que `totalAmount` está correto

### 6.4 Venda com Desconto Percentual

- [ ] Adicionar produtos (ex: R$ 100)
- [ ] Aplicar desconto de 20%
- [ ] ✅ Verificar novo total = R$ 80
- [ ] Finalizar
- [ ] ✅ Verificar cálculo salvo corretamente

### 6.5 Venda com Promoção Automática

- [ ] Criar promoção ativa (ex: 10% em categoria X)
- [ ] Adicionar produto da categoria X
- [ ] ✅ Verificar aplicação automática do desconto
- [ ] ✅ Verificar que `promotionId` está vinculado
- [ ] Finalizar
- [ ] ✅ Verificar que promoção foi registrada na venda

### 6.6 Venda com Cartão de Crédito (1x)

- [ ] Selecionar "Crédito" como pagamento
- [ ] Escolher "1x"
- [ ] ✅ Verificar que não há taxa
- [ ] Finalizar
- [ ] ✅ Verificar `paymentMethod` = `credit_card`
- [ ] ✅ Verificar `installments` = 1
- [ ] ✅ Verificar `installmentAmount` = totalAmount

### 6.7 Venda Parcelada (Crédito 6x)

- [ ] Venda de R$ 600
- [ ] Selecionar "Crédito 6x"
- [ ] ✅ Verificar exibição de taxa (ex: 2.5%)
- [ ] ✅ Verificar total com taxa
- [ ] ✅ Verificar valor da parcela
- [ ] Finalizar
- [ ] ✅ Verificar `installments` = 6
- [ ] ✅ Verificar `interestRate` salvo
- [ ] ✅ Verificar `installmentAmount` correto

### 6.8 Venda com PIX

- [ ] Selecionar PIX
- [ ] Finalizar
- [ ] ✅ Verificar `paymentMethod` = `pix`
- [ ] ✅ Opcionalmente, verificar geração de QR Code

### 6.9 Venda com Vale (Crédito do Cliente)

- [ ] Cliente com crédito > valor da venda
- [ ] Selecionar "Vale/Crédito"
- [ ] Finalizar
- [ ] ✅ Verificar dedução do crédito do cliente
- [ ] ✅ Verificar transação financeira de débito de crédito

### 6.10 Venda de Serviço

- [ ] Adicionar um serviço ao carrinho
- [ ] ✅ Verificar que não afeta estoque
- [ ] Finalizar
- [ ] ✅ Verificar criação normal da venda
- [ ] ✅ Verificar categoria da transação como `service_sale`

### 6.11 Cancelar Venda

- [ ] Ir em `/dashboard/vendas`
- [ ] Selecionar uma venda `completed`
- [ ] Clicar em "Cancelar Venda"
- [ ] Confirmar
- [ ] ✅ Verificar mudança de `status` para `canceled`
- [ ] ✅ Verificar devolução de estoque dos produtos
- [ ] ✅ Verificar criação de transação de estorno
- [ ] ✅ Se tinha crédito aplicado, verificar devolução

### 6.12 Imprimir Recibo

- [ ] Finalizar venda
- [ ] Clicar em "Imprimir Recibo"
- [ ] ✅ Verificar exibição de modal/preview
- [ ] ✅ Verificar dados corretos:
  - [ ] Nome da empresa
  - [ ] CNPJ
  - [ ] Endereço
  - [ ] Itens da venda
  - [ ] Valores
  - [ ] Forma de pagamento
  - [ ] Data/hora
- [ ] Clicar em "Imprimir"
- [ ] ✅ Verificar abertura da janela de impressão

### 6.13 Enviar Recibo por E-mail

- [ ] Finalizar venda com cliente que tem e-mail
- [ ] Clicar em "Enviar por E-mail"
- [ ] ✅ Verificar envio do e-mail (conferir inbox)
- [ ] ✅ Verificar formatação do e-mail
- [ ] ✅ Verificar anexo PDF (se implementado)

---

## 7️⃣ TESTES DE PROMOÇÕES

### 7.1 Criar Promoção de Desconto Percentual

- [ ] Acessar `/dashboard/promocoes`
- [ ] Criar nova promoção:
  - [ ] Nome: "Black Friday"
  - [ ] Tipo: Percentual
  - [ ] Valor: 20%
  - [ ] Categoria: Eletrônicos
  - [ ] Data início: hoje
  - [ ] Data fim: +7 dias
  - [ ] Ativa
- [ ] Salvar
- [ ] ✅ Verificar criação no banco
- [ ] Fazer venda com produto da categoria
- [ ] ✅ Verificar aplicação automática do desconto

### 7.2 Promoção de Desconto Fixo

- [ ] Criar promoção com desconto fixo (R$ 50)
- [ ] Aplicar a produto/categoria
- [ ] Fazer venda
- [ ] ✅ Verificar desconto aplicado corretamente

### 7.3 Promoção "Leve 3, Pague 2"

- [ ] Criar promoção:
  - [ ] Tipo: "Compre X, Ganhe Y"
  - [ ] Compre: 3
  - [ ] Pague: 2
  - [ ] Produto específico
- [ ] Adicionar 3 unidades do produto
- [ ] ✅ Verificar que cobra apenas 2
- [ ] Adicionar 6 unidades
- [ ] ✅ Verificar que cobra 4

### 7.4 Promoção Inativa

- [ ] Criar promoção e marcar como inativa
- [ ] Fazer venda
- [ ] ✅ Verificar que promoção NÃO foi aplicada

### 7.5 Promoção Expirada

- [ ] Criar promoção com data fim passada
- [ ] Fazer venda
- [ ] ✅ Verificar que promoção NÃO foi aplicada

### 7.6 Múltiplas Promoções Ativas

- [ ] Criar 2+ promoções para mesma categoria
- [ ] Fazer venda
- [ ] ✅ Verificar que apenas a melhor promoção foi aplicada
- [ ] ✅ Ou verificar se aplicou em stack (se implementado)

### 7.7 Editar Promoção Ativa

- [ ] Editar promoção em andamento
- [ ] Alterar desconto ou período
- [ ] ✅ Verificar que novas vendas usam novos valores
- [ ] ✅ Verificar que vendas antigas mantêm valores originais

### 7.8 Excluir Promoção

- [ ] Excluir promoção
- [ ] ✅ Verificar remoção ou soft delete
- [ ] ✅ Verificar que vendas antigas mantêm referência

---

## 8️⃣ TESTES DE COLABORADORES (MODO VENDEDOR)

### 8.1 Criar Colaborador

- [ ] Acessar `/dashboard/colaboradores`
- [ ] Criar novo colaborador:
  - [ ] Nome
  - [ ] E-mail
  - [ ] PIN de 4 dígitos
  - [ ] Taxa de comissão (ex: 5%)
  - [ ] Ativo
- [ ] Salvar
- [ ] ✅ Verificar criação no banco
- [ ] ✅ Verificar que PIN foi criptografado (bcrypt)

### 8.2 Ativar Modo Vendedor

- [ ] No dashboard, clicar em "Modo Vendedor"
- [ ] Selecionar colaborador
- [ ] Inserir PIN
- [ ] ✅ Verificar autenticação do PIN
- [ ] ✅ Verificar mudança da interface (modo simplificado)
- [ ] ✅ Verificar que apenas PDV e Vendas estão acessíveis

### 8.3 Venda no Modo Vendedor

- [ ] Com modo vendedor ativo
- [ ] Fazer venda
- [ ] ✅ Verificar que `sellerId` = ID do colaborador
- [ ] ✅ Verificar que `userId` = proprietário
- [ ] ✅ Verificar cálculo da comissão

### 8.4 Comissão do Vendedor

- [ ] Vendedor com 5% de comissão
- [ ] Fazer venda de R$ 100
- [ ] ✅ Verificar que comissão = R$ 5
- [ ] ✅ Verificar criação de `FinancialTransaction`:
  - `type` = `commission`
  - `amount` = -500 (débito)
  - `collaboratorId` vinculado

### 8.5 Sair do Modo Vendedor

- [ ] Clicar em "Sair do Modo Vendedor"
- [ ] Inserir PIN do proprietário
- [ ] ✅ Verificar desautenticação
- [ ] ✅ Verificar retorno ao dashboard completo

### 8.6 Tentativa de PIN Incorreto

- [ ] Tentar entrar no modo vendedor com PIN errado
- [ ] ✅ Verificar mensagem de erro
- [ ] ✅ Verificar que modo não foi ativado

### 8.7 Desativar Colaborador

- [ ] Marcar colaborador como inativo
- [ ] Tentar ativar modo vendedor com ele
- [ ] ✅ Verificar mensagem de erro
- [ ] ✅ Verificar que não permite acesso

### 8.8 Editar Colaborador

- [ ] Alterar nome, comissão ou PIN
- [ ] Salvar
- [ ] ✅ Verificar atualização
- [ ] Fazer venda
- [ ] ✅ Verificar que nova comissão é aplicada

### 8.9 Excluir Colaborador

- [ ] Excluir colaborador
- [ ] ✅ Verificar remoção ou soft delete
- [ ] ✅ Verificar que vendas antigas mantêm referência

---

## 9️⃣ TESTES DE FINANÇAS

### 9.1 Visualizar Dashboard Financeiro

- [ ] Acessar `/dashboard/financas`
- [ ] ✅ Verificar exibição de cards:
  - [ ] Receita total
  - [ ] Despesas totais
  - [ ] Lucro líquido
  - [ ] Vendas pendentes
- [ ] ✅ Verificar gráfico de evolução mensal
- [ ] ✅ Verificar lista de últimas transações

### 9.2 Adicionar Despesa Manual

- [ ] Clicar em "Nova Transação"
- [ ] Selecionar tipo "Despesa"
- [ ] Preencher:
  - [ ] Descrição
  - [ ] Valor
  - [ ] Categoria (ex: Aluguel)
  - [ ] Data
  - [ ] Método de pagamento
- [ ] Salvar
- [ ] ✅ Verificar criação em `FinancialTransaction`:
  - `type` = `expense`
  - `amount` negativo
- [ ] ✅ Verificar atualização do saldo

### 9.3 Adicionar Receita Manual

- [ ] Adicionar transação de receita
- [ ] ✅ Verificar `type` = `income`
- [ ] ✅ Verificar `amount` positivo
- [ ] ✅ Verificar atualização do saldo

### 9.4 Filtrar por Período

- [ ] Selecionar período (ex: último mês)
- [ ] ✅ Verificar que apenas transações do período aparecem
- [ ] ✅ Verificar recálculo dos totais

### 9.5 Filtrar por Categoria

- [ ] Filtrar por categoria específica
- [ ] ✅ Verificar que apenas transações da categoria aparecem

### 9.6 Filtrar por Tipo

- [ ] Filtrar apenas receitas
- [ ] ✅ Verificar lista filtrada
- [ ] Filtrar apenas despesas
- [ ] ✅ Verificar lista filtrada

### 9.7 Editar Transação

- [ ] Editar transação manual
- [ ] Alterar valor ou descrição
- [ ] Salvar
- [ ] ✅ Verificar atualização
- [ ] ✅ Verificar recálculo dos totais

### 9.8 Excluir Transação

- [ ] Excluir transação manual
- [ ] ✅ Verificar remoção
- [ ] ✅ Verificar recálculo dos totais
- [ ] Tentar excluir transação de venda
- [ ] ✅ Verificar mensagem de erro (não permitido)

### 9.9 Contas a Receber

- [ ] Acessar `/dashboard/financas/contas-a-receber`
- [ ] ✅ Verificar lista de vendas parceladas
- [ ] ✅ Verificar cálculo de:
  - [ ] Valor total a receber
  - [ ] Parcelas pendentes
  - [ ] Próximos vencimentos
- [ ] Marcar parcela como recebida
- [ ] ✅ Verificar atualização do status

### 9.10 Exportar Relatório Financeiro

- [ ] Selecionar período
- [ ] Clicar em "Exportar"
- [ ] ✅ Verificar download de PDF ou Excel
- [ ] ✅ Verificar dados corretos no arquivo

---

## 🔟 TESTES DE INDIQUE E GANHE

### 10.1 Visualizar Código de Indicação

- [ ] Acessar `/dashboard/indique-e-ganhe`
- [ ] ✅ Verificar exibição do código único (ex: CHRONOS-12345)
- [ ] ✅ Verificar link completo de indicação

### 10.2 Copiar Link de Indicação

- [ ] Clicar em "Copiar Link"
- [ ] ✅ Verificar mensagem de confirmação
- [ ] Colar em navegador
- [ ] ✅ Verificar que abre registro com código preenchido

### 10.3 Compartilhar no WhatsApp

- [ ] Clicar em "Compartilhar no WhatsApp"
- [ ] ✅ Verificar abertura do WhatsApp
- [ ] ✅ Verificar mensagem pré-formatada com link

### 10.4 Visualizar Indicações

- [ ] ✅ Verificar lista de pessoas indicadas:
  - [ ] Nome
  - [ ] Data de cadastro
  - [ ] Status (pendente/ativa)
  - [ ] Valor ganho
- [ ] ✅ Verificar total de indicações
- [ ] ✅ Verificar total ganho em créditos

### 10.5 Indicação Pendente → Ativa

- [ ] Usuário indicado cria conta (gratuita)
- [ ] ✅ Verificar que aparece como "Pendente"
- [ ] Usuário indicado assina plano pago
- [ ] ✅ Verificar mudança para "Ativa"
- [ ] ✅ Verificar crédito de R$ 50 para indicador

### 10.6 Usar Créditos em Compra

- [ ] Indicador com créditos
- [ ] Fazer compra própria (via dashboard)
- [ ] Selecionar "Usar Créditos"
- [ ] ✅ Verificar desconto aplicado
- [ ] ✅ Verificar dedução dos créditos

---

## 1️⃣1️⃣ TESTES DE RELATÓRIOS

### 11.1 Relatório de Vendas

- [ ] Acessar `/dashboard/relatorios`
- [ ] Selecionar "Relatório de Vendas"
- [ ] Escolher período
- [ ] ✅ Verificar exibição de:
  - [ ] Total de vendas
  - [ ] Ticket médio
  - [ ] Produtos mais vendidos
  - [ ] Gráfico de evolução diária
  - [ ] Vendas por categoria
  - [ ] Vendas por vendedor

### 11.2 Relatório de Estoque

- [ ] Selecionar "Relatório de Estoque"
- [ ] ✅ Verificar:
  - [ ] Produtos em estoque
  - [ ] Produtos com estoque baixo
  - [ ] Valor total do estoque
  - [ ] Movimentações recentes

### 11.3 Relatório de Comissões

- [ ] Selecionar "Relatório de Comissões"
- [ ] Escolher período
- [ ] ✅ Verificar:
  - [ ] Comissões por vendedor
  - [ ] Total de comissões
  - [ ] Vendas por vendedor

### 11.4 Relatório Financeiro

- [ ] Selecionar "Relatório Financeiro"
- [ ] Escolher período
- [ ] ✅ Verificar:
  - [ ] DRE (Demonstrativo de Resultados)
  - [ ] Receitas por categoria
  - [ ] Despesas por categoria
  - [ ] Fluxo de caixa

### 11.5 Exportar Relatório

- [ ] Em qualquer relatório
- [ ] Clicar em "Exportar PDF"
- [ ] ✅ Verificar download
- [ ] ✅ Verificar formatação do PDF
- [ ] Clicar em "Exportar Excel"
- [ ] ✅ Verificar download
- [ ] ✅ Verificar dados corretos

---

## 1️⃣2️⃣ TESTES DE CONFIGURAÇÕES

### 12.1 Personalizar Tema (Modo Claro)

- [ ] Acessar `/dashboard/configuracoes`
- [ ] Selecionar tema pré-definido
- [ ] ✅ Verificar mudança instantânea das cores
- [ ] Salvar
- [ ] ✅ Verificar que salvou no banco (`Settings`)
- [ ] Recarregar página
- [ ] ✅ Verificar que tema permanece

### 12.2 Tema Personalizado

- [ ] Clicar em "Personalizado"
- [ ] Alterar cores:
  - [ ] Cor primária
  - [ ] Cor de destaque
  - [ ] Cor de fundo
  - [ ] Cor dos cards
  - [ ] Cor do header
- [ ] ✅ Verificar aplicação em tempo real
- [ ] Salvar
- [ ] ✅ Verificar salvamento no banco

### 12.3 Alternar Modo Claro/Escuro

- [ ] Alternar para modo escuro
- [ ] ✅ Verificar mudança de todas as cores
- [ ] ✅ Verificar que tem temas separados
- [ ] Personalizar tema escuro
- [ ] Alternar para claro
- [ ] ✅ Verificar que mantém personalizações separadas

### 12.4 Configurar Taxas de Pagamento

- [ ] Abrir "Taxas de Meios de Pagamento"
- [ ] Configurar taxas:
  - [ ] Dinheiro: 0%
  - [ ] PIX: 0%
  - [ ] Débito: 1.5%
  - [ ] Crédito 1x: 2%
  - [ ] Crédito 2x-6x: 2.5%, 3%, etc.
  - [ ] Crédito 7x-12x: 3.5%, 4%, etc.
- [ ] Salvar
- [ ] ✅ Verificar salvamento no banco
- [ ] Fazer venda parcelada
- [ ] ✅ Verificar aplicação das taxas configuradas

### 12.5 Configurar Logo Personalizada

- [ ] Abrir "Logo Personalizada"
- [ ] Colar código SVG
- [ ] ✅ Verificar preview da logo
- [ ] Salvar
- [ ] ✅ Verificar que logo aparece no header
- [ ] Recarregar
- [ ] ✅ Verificar persistência

### 12.6 Remover Logo Personalizada

- [ ] Clicar em "Remover Logo"
- [ ] ✅ Verificar retorno à logo padrão
- [ ] ✅ Verificar remoção do banco

### 12.7 Configurar Dados da Empresa

- [ ] Abrir "Informações da Empresa"
- [ ] Preencher:
  - [ ] Nome da empresa
  - [ ] CNPJ
  - [ ] Telefone
  - [ ] Endereço completo
- [ ] Salvar
- [ ] ✅ Verificar salvamento
- [ ] Imprimir recibo de venda
- [ ] ✅ Verificar que dados aparecem no recibo

### 12.8 Configurar PIN do Proprietário

- [ ] Inserir novo PIN de 4 dígitos
- [ ] Salvar
- [ ] ✅ Verificar mensagem de sucesso
- [ ] Tentar sair do modo vendedor
- [ ] ✅ Verificar que solicita novo PIN

---

## 1️⃣3️⃣ TESTES DE INTEGRAÇÃO STRIPE

### 13.1 Configurar Chaves Stripe

- [ ] Adicionar em `.env.local`:
  - `STRIPE_SECRET_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- [ ] Reiniciar servidor
- [ ] ✅ Verificar que checkout funciona

### 13.2 Testar Webhook Local

- [ ] Rodar `stripe listen --forward-to localhost:9002/api/stripe/webhook`
- [ ] Fazer assinatura de teste
- [ ] ✅ Verificar que webhook foi recebido no terminal
- [ ] ✅ Verificar processamento correto

### 13.3 Webhook - Diferentes Eventos

- [ ] Simular eventos:
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`
- [ ] ✅ Verificar tratamento correto de cada evento

---

## 1️⃣4️⃣ TESTES DE SEGURANÇA

### 14.1 Acesso sem Autenticação

- [ ] Deslogar
- [ ] Tentar acessar `/dashboard` diretamente
- [ ] ✅ Verificar redirecionamento para `/login`
- [ ] Tentar acessar `/api/products` sem auth
- [ ] ✅ Verificar resposta 401 Unauthorized

### 14.2 Proteção de Rotas de API

- [ ] Tentar chamar APIs sem token/sessão
- [ ] ✅ Verificar retorno 401
- [ ] Tentar acessar dados de outro usuário
- [ ] ✅ Verificar bloqueio (403 Forbidden)

### 14.3 Validação de Inputs

- [ ] Tentar criar produto com:
  - [ ] Nome vazio
  - [ ] Preço negativo
  - [ ] Estoque negativo
- [ ] ✅ Verificar mensagens de erro
- [ ] ✅ Verificar que não salvou no banco

### 14.4 Injeção SQL (Prisma)

- [ ] Tentar inserir SQL em campos de texto
- [ ] ✅ Verificar que Prisma sanitiza automaticamente
- [ ] ✅ Verificar que não executou SQL malicioso

### 14.5 XSS (Cross-Site Scripting)

- [ ] Tentar inserir `<script>alert('XSS')</script>` em campos
- [ ] ✅ Verificar que Next.js escapa automaticamente
- [ ] ✅ Verificar que script não é executado

### 14.6 CSRF (Cross-Site Request Forgery)

- [ ] Verificar presença de tokens CSRF
- [ ] Tentar fazer request de origem externa
- [ ] ✅ Verificar bloqueio

### 14.7 Senha Criptografada

- [ ] Criar usuário
- [ ] Verificar banco de dados
- [ ] ✅ Verificar que senha está hasheada (bcrypt)
- [ ] ✅ Verificar que não é possível ler senha original

### 14.8 PIN Criptografado

- [ ] Criar colaborador com PIN
- [ ] Verificar banco
- [ ] ✅ Verificar hash do PIN
- [ ] ✅ Verificar que autenticação funciona com hash

---

## 1️⃣5️⃣ TESTES DE PERFORMANCE

### 15.1 Tempo de Carregamento do Dashboard

- [ ] Logar e acessar dashboard
- [ ] ✅ Verificar carregamento < 2 segundos
- [ ] ✅ Verificar que dados carregam progressivamente

### 15.2 Lista de Produtos com Muitos Itens

- [ ] Criar 100+ produtos
- [ ] Acessar lista de produtos
- [ ] ✅ Verificar paginação ou scroll infinito
- [ ] ✅ Verificar que não trava

### 15.3 Busca de Produtos

- [ ] Buscar produto por nome
- [ ] ✅ Verificar resposta rápida (< 1s)
- [ ] ✅ Verificar resultados corretos

### 15.4 Múltiplas Vendas Simultâneas

- [ ] Fazer 5+ vendas em sequência rápida
- [ ] ✅ Verificar que todas foram processadas
- [ ] ✅ Verificar que estoques estão corretos
- [ ] ✅ Verificar que não houve race condition

### 15.5 Upload de Imagem Grande

- [ ] Fazer upload de imagem 5+ MB
- [ ] ✅ Verificar tempo de upload razoável
- [ ] ✅ Verificar compressão/otimização (se implementado)

---

## 1️⃣6️⃣ TESTES DE RESPONSIVIDADE

### 16.1 Mobile (375px)

- [ ] Acessar em tela 375px (iPhone)
- [ ] ✅ Verificar que todo conteúdo está visível
- [ ] ✅ Verificar que menu lateral vira hamburguer
- [ ] ✅ Verificar que tabelas são scrolláveis

### 16.2 Tablet (768px)

- [ ] Acessar em tela 768px (iPad)
- [ ] ✅ Verificar layout adaptado
- [ ] ✅ Verificar funcionalidade completa

### 16.3 Desktop (1920px)

- [ ] Acessar em tela 1920px
- [ ] ✅ Verificar uso eficiente do espaço
- [ ] ✅ Verificar que não há elementos "perdidos"

### 16.4 PDV no Mobile

- [ ] Acessar PDV no celular
- [ ] ✅ Verificar que é usável para fazer vendas
- [ ] ✅ Verificar teclado numérico para quantidades
- [ ] Fazer venda completa no mobile
- [ ] ✅ Verificar sucesso

---

## 1️⃣7️⃣ TESTES DE NAVEGAÇÃO

### 17.1 Menu Lateral

- [ ] Clicar em cada item do menu
- [ ] ✅ Verificar navegação correta
- [ ] ✅ Verificar que item ativo é destacado

### 17.2 Breadcrumbs

- [ ] Navegar para página aninhada
- [ ] ✅ Verificar exibição de breadcrumb
- [ ] Clicar em item do breadcrumb
- [ ] ✅ Verificar navegação correta

### 17.3 Voltar com Navegador

- [ ] Navegar entre páginas
- [ ] Clicar em "Voltar" do navegador
- [ ] ✅ Verificar que volta para página anterior
- [ ] ✅ Verificar que estado é preservado

### 17.4 Links Externos

- [ ] Clicar em links para documentação/suporte
- [ ] ✅ Verificar que abre em nova aba
- [ ] ✅ Verificar que URL está correta

---

## 1️⃣8️⃣ TESTES DE NOTIFICAÇÕES

### 18.1 Toast de Sucesso

- [ ] Fazer ação bem-sucedida (criar produto)
- [ ] ✅ Verificar exibição de toast verde
- [ ] ✅ Verificar mensagem apropriada
- [ ] ✅ Verificar que desaparece após 3-5s

### 18.2 Toast de Erro

- [ ] Fazer ação com erro (SKU duplicado)
- [ ] ✅ Verificar exibição de toast vermelho
- [ ] ✅ Verificar mensagem de erro clara

### 18.3 Toast de Aviso

- [ ] Ação com aviso (estoque baixo)
- [ ] ✅ Verificar toast amarelo
- [ ] ✅ Verificar mensagem de aviso

### 18.4 Confirmação de Ação Destrutiva

- [ ] Tentar excluir produto
- [ ] ✅ Verificar exibição de modal de confirmação
- [ ] Cancelar
- [ ] ✅ Verificar que não excluiu
- [ ] Excluir novamente e confirmar
- [ ] ✅ Verificar exclusão

---

## 1️⃣9️⃣ TESTES DE ACESSIBILIDADE

### 19.1 Navegação por Teclado

- [ ] Navegar pela interface usando Tab
- [ ] ✅ Verificar ordem lógica de foco
- [ ] ✅ Verificar indicador visual de foco
- [ ] Pressionar Enter em botões
- [ ] ✅ Verificar ativação correta

### 19.2 Contraste de Cores

- [ ] Usar ferramenta de contraste (WCAG)
- [ ] ✅ Verificar que textos têm contraste mínimo 4.5:1
- [ ] ✅ Verificar em modo claro e escuro

### 19.3 Textos Alternativos

- [ ] Inspecionar imagens
- [ ] ✅ Verificar presença de atributo `alt`
- [ ] ✅ Verificar que descrições são significativas

### 19.4 Leitor de Tela

- [ ] Ativar leitor de tela (NVDA/VoiceOver)
- [ ] Navegar pela interface
- [ ] ✅ Verificar que conteúdo é lido corretamente
- [ ] ✅ Verificar labels em formulários

---

## 2️⃣0️⃣ TESTES DE DADOS E INTEGRIDADE

### 20.1 Consistência de Estoque

- [ ] Fazer venda de 5 unidades
- [ ] ✅ Verificar redução de 5 no estoque
- [ ] Cancelar venda
- [ ] ✅ Verificar que voltou para valor original
- [ ] Fazer 10 vendas do mesmo produto
- [ ] ✅ Verificar que estoque está correto

### 20.2 Integridade Referencial

- [ ] Excluir categoria com produtos
- [ ] ✅ Verificar que produtos não ficam órfãos
- [ ] Excluir cliente com vendas
- [ ] ✅ Verificar que vendas mantêm referência

### 20.3 Transações Financeiras Balanceadas

- [ ] Somar todas as receitas
- [ ] Somar todas as despesas
- [ ] ✅ Verificar que saldo = receitas - despesas
- [ ] ✅ Verificar que cada venda tem transação correspondente

### 20.4 Auditoria de Alterações

- [ ] Editar produto
- [ ] ✅ Verificar log de alteração (se implementado)
- [ ] ✅ Verificar que guarda quem alterou e quando

---

## 📊 RESUMO DO CHECKLIST

**Total de Testes:** 220+

### Distribuição por Módulo:

- ✅ Autenticação: 5 testes
- ✅ Assinatura (Stripe): 6 testes
- ✅ Sistema de Trial: 5 testes (NOVO)
- ✅ Produtos/Serviços: 6 testes
- ✅ Categorias: 4 testes
- ✅ Clientes: 6 testes
- ✅ Vendas (PDV): 13 testes
- ✅ Promoções: 8 testes
- ✅ Colaboradores: 9 testes
- ✅ Finanças: 10 testes
- ✅ Indique e Ganhe: 6 testes
- ✅ Relatórios: 5 testes
- ✅ Configurações: 8 testes
- ✅ Integração Stripe: 3 testes
- ✅ Segurança: 8 testes
- ✅ Performance: 5 testes
- ✅ Responsividade: 4 testes
- ✅ Navegação: 4 testes
- ✅ Notificações: 4 testes
- ✅ Acessibilidade: 4 testes
- ✅ Dados e Integridade: 4 testes

---

## 🎯 CENÁRIOS CRÍTICOS DE NEGÓCIO

### Cenário 1: Primeiro Usuário (Trial de 1 Dia)

1. ✅ Criar conta sem código
2. ✅ Verificar que recebeu trial de 24 horas
3. ✅ Criar produtos e categorias durante o trial
4. ✅ Fazer primeira venda
5. ✅ Verificar acesso completo durante o trial
6. ✅ Ver contador de trial na página de assinatura
7. ✅ Após 24h, verificar bloqueio e necessidade de assinatura

### Cenário 2: Usuário Indicado → Trial → Assinante Profissional

1. ✅ Criar conta com código de indicação
2. ✅ Receber trial de 1 dia automático
3. ✅ Verificar status "pendente" no indicador
4. ✅ Usar sistema durante trial
5. ✅ Assinar plano Profissional antes do trial expirar
6. ✅ Indicador recebe R$ 50 imediatamente
7. ✅ Status do referral muda para "completed"
8. ✅ Fazer múltiplas vendas usando recursos do plano

### Cenário 3: Loja Completa com Vendedores

1. ✅ Proprietário cria 3 colaboradores
2. ✅ Configura comissões diferentes (5%, 7%, 10%)
3. ✅ Cada vendedor faz vendas no seu modo
4. ✅ Verificar cálculo correto de todas as comissões
5. ✅ Gerar relatório de comissões
6. ✅ Proprietário verifica lucro líquido

### Cenário 4: Promoção de Black Friday

1. ✅ Criar múltiplas promoções (categoria, produto, global)
2. ✅ Configurar datas de início e fim
3. ✅ Fazer vendas durante promoção
4. ✅ Verificar aplicação correta de descontos
5. ✅ Após fim, verificar que promoções não se aplicam mais
6. ✅ Gerar relatório de impacto das promoções

---

## 🚨 TESTES DE REGRESSÃO (Após Updates)

Sempre que fizer update no código, executar:

- [ ] Build de produção passa
- [ ] Login funciona
- [ ] Fazer uma venda simples
- [ ] Criar um produto
- [ ] Visualizar relatório financeiro

---

## 📝 NOTAS IMPORTANTES

- Executar testes em **3 navegadores**: Chrome, Firefox, Safari
- Testar em **2 dispositivos mobile** reais (iOS e Android)
- Usar **dados realistas** (não apenas "teste123")
- **Limpar banco** entre baterias de teste para consistência
- **Documentar bugs** encontrados com prints e passos para reproduzir

---

## ✅ APROVAÇÃO FINAL

Para considerar o aplicativo pronto para produção, verificar:

- [ ] ✅ 95%+ dos testes passaram
- [ ] ✅ Bugs críticos corrigidos
- [ ] ✅ Performance aceitável (< 3s carregamento)
- [ ] ✅ Dados de produção migrados corretamente
- [ ] ✅ Backup configurado
- [ ] ✅ Monitoramento ativo (logs, errors)
- [ ] ✅ Documentação atualizada
- [ ] ✅ Sistema de trial de 1 dia funcionando corretamente
- [ ] ✅ Integração Stripe validada (checkout e webhooks)

---

**Data de Criação:** 16 de novembro de 2025  
**Última Atualização:** 16 de novembro de 2025  
**Versão:** 2.0 - Trial de 1 Dia  
**Status:** Atualizado e Pronto para Execução 🚀
