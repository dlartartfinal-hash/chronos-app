# 🔄 Arquitetura Offline-First - Chronos PDV

**Versão:** 1.0  
**Data:** 16 de novembro de 2025  
**Status:** Pré-implementação (Produto não lançado)

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura Técnica](#arquitetura-técnica)
3. [Sistema de Alertas](#sistema-de-alertas)
4. [Implementação PWA](#implementação-pwa)
5. [Sincronização Inteligente](#sincronização-inteligente)
6. [Resolução de Conflitos](#resolução-de-conflitos)
7. [Roadmap de Desenvolvimento](#roadmap-de-desenvolvimento)
8. [Testes e Validação](#testes-e-validação)

---

## 🎯 Visão Geral

### **Por que Offline-First?**

O varejo brasileiro enfrenta:

- 📉 Internet instável em 60%+ dos estabelecimentos
- 💸 Perda de vendas durante quedas de conexão
- 😤 Frustração do lojista (principal causa de churn)

### **Solução Chronos:**

```
┌─────────────────────────────────────────────┐
│  "Venda sempre, sincronize depois"          │
│  Sistema funciona 100% offline no navegador │
│  Sincronização automática quando reconectar │
└─────────────────────────────────────────────┘
```

### **Diferencial Competitivo:**

| Sistema     | Offline         | Sync Auto     | Alertas Inteligentes |
| ----------- | --------------- | ------------- | -------------------- |
| Bling       | ❌              | ❌            | ❌                   |
| Vhsys       | ⚠️ App desktop  | Parcial       | Básico               |
| Nex         | ❌              | ❌            | ❌                   |
| **Chronos** | ✅ PWA completo | ✅ Background | ✅ Avançado          |

---

## 🏗️ Arquitetura Técnica

### **Stack Tecnológico:**

```typescript
// Tecnologias PWA
- Service Worker (Workbox)
- IndexedDB (Dexie.js)
- Background Sync API
- Cache API
- Push Notifications API
```

### **Diagrama de Arquitetura:**

```
┌─────────────────────────────────────────────────────┐
│              NAVEGADOR (Chrome/Edge)                │
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │  React UI (Next.js)                        │   │
│  │  - Dashboard PDV                           │   │
│  │  - Produtos/Estoque                        │   │
│  │  - Vendas                                  │   │
│  └────────────────────────────────────────────┘   │
│                    ↕                                │
│  ┌────────────────────────────────────────────┐   │
│  │  Sync Manager (React Context)             │   │
│  │  - Detecta online/offline                  │   │
│  │  - Enfileira operações                     │   │
│  │  - Gerencia conflitos                      │   │
│  └────────────────────────────────────────────┘   │
│                    ↕                                │
│  ┌────────────────────────────────────────────┐   │
│  │  IndexedDB (Dexie.js)                      │   │
│  │  - Produtos (top 500)                      │   │
│  │  - Estoque atual                           │   │
│  │  - Vendas pendentes                        │   │
│  │  - Clientes frequentes                     │   │
│  │  - Fila de sincronização                   │   │
│  └────────────────────────────────────────────┘   │
│                    ↕                                │
│  ┌────────────────────────────────────────────┐   │
│  │  Service Worker (Workbox)                  │   │
│  │  - Cache de assets (HTML/CSS/JS/imagens)   │   │
│  │  - Intercepta requisições                  │   │
│  │  - Background Sync quando reconectar       │   │
│  └────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                        ↕
              (quando online)
                        ↕
┌─────────────────────────────────────────────────────┐
│         SERVIDOR VPS (Next.js API + PostgreSQL)     │
│  - Recebe sincronizações                            │
│  - Valida conflitos                                 │
│  - Retorna estado atualizado                        │
└─────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuração do Modo Offline

### **Habilitação Manual Obrigatória**

O modo offline **NÃO é ativado automaticamente**. O usuário precisa habilitá-lo conscientemente após entender os riscos.

### **Página de Configurações (Dashboard > Configurações)**

#### **Interface de Configuração:**

```tsx
// src/app/dashboard/configuracoes/page.tsx

<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <WifiOff className="h-5 w-5" />
      Modo Offline
    </CardTitle>
    <CardDescription>
      Permite usar o sistema sem conexão com a internet
    </CardDescription>
  </CardHeader>

  <CardContent className="space-y-4">
    {/* Toggle de Ativação */}
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="offline-mode" className="text-base">
          Habilitar Modo Offline
        </Label>
        <p className="text-sm text-muted-foreground">
          Sistema funcionará sem internet e sincronizará depois
        </p>
      </div>
      <Switch
        id="offline-mode"
        checked={offlineModeEnabled}
        onCheckedChange={handleToggleOfflineMode}
      />
    </div>

    {/* Aviso de Ativação */}
    {!offlineModeEnabled && (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Modo Offline Desativado</AlertTitle>
        <AlertDescription>
          Ative para continuar trabalhando quando a internet cair. Suas vendas
          serão sincronizadas automaticamente quando reconectar.
        </AlertDescription>
      </Alert>
    )}

    {/* Lista de Problemas Possíveis */}
    {offlineModeEnabled && (
      <Alert variant="warning" className="border-yellow-500">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>⚠️ Problemas Possíveis ao Trabalhar Offline</AlertTitle>
        <AlertDescription>
          <div className="mt-3 space-y-3">
            <div className="text-sm">
              <p className="font-semibold mb-2">
                Esteja ciente dos seguintes riscos:
              </p>

              <ol className="space-y-2 list-decimal list-inside">
                <li>
                  <strong>Conflitos de Estoque:</strong> Se você e outro
                  dispositivo venderem o mesmo produto offline, pode haver
                  estoque negativo após sincronização.
                </li>

                <li>
                  <strong>Vendas com Cartão:</strong> Pagamentos por cartão
                  precisam de internet. Offline, só aceite dinheiro ou PIX
                  (registre como "pendente").
                </li>

                <li>
                  <strong>Limite de Armazenamento:</strong> Seu navegador tem
                  limite de ~50MB. Ao atingir 95%, o sistema será bloqueado até
                  sincronizar.
                </li>

                <li>
                  <strong>Sincronização Obrigatória:</strong> Você DEVE
                  reconectar pelo menos a cada 24 horas para enviar vendas. Caso
                  contrário, dados podem ser perdidos.
                </li>

                <li>
                  <strong>Relatórios Desatualizados:</strong> Relatórios offline
                  mostram apenas dados locais. Para visão completa, precisa
                  estar online.
                </li>

                <li>
                  <strong>Emissão de NF-e Impossível:</strong> Notas fiscais
                  exigem conexão com SEFAZ. Registre vendas offline e emita NF-e
                  depois.
                </li>

                <li>
                  <strong>Múltiplos Dispositivos:</strong> Usar vários
                  dispositivos offline simultaneamente aumenta risco de
                  conflitos. Sincronize frequentemente.
                </li>

                <li>
                  <strong>Cache Pode Ficar Desatualizado:</strong> Preços e
                  estoque mostrados são da última sincronização. Podem não
                  refletir mudanças feitas em outros lugares.
                </li>
              </ol>
            </div>

            {/* Checkbox de Confirmação */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="acknowledge-risks"
                  checked={risksAcknowledged}
                  onCheckedChange={setRisksAcknowledged}
                />
                <label
                  htmlFor="acknowledge-risks"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Li e compreendi os riscos acima. Assumo a responsabilidade por
                  usar o modo offline.
                </label>
              </div>
            </div>

            {/* Botão de Confirmação */}
            <Button
              onClick={enableOfflineMode}
              disabled={!risksAcknowledged}
              className="w-full"
              variant={risksAcknowledged ? "default" : "secondary"}
            >
              {risksAcknowledged ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Ativar Modo Offline
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Confirme os Riscos para Ativar
                </>
              )}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )}

    {/* Informações do Cache (se ativado) */}
    {offlineModeEnabled && (
      <div className="grid gap-4 mt-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Uso do Cache</span>
            <span className="font-medium">{cacheUsage}%</span>
          </div>
          <Progress value={cacheUsage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {cacheSize}MB de {maxCacheSize}MB usado
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Produtos em Cache</p>
            <p className="text-2xl font-bold">{cachedProducts}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Vendas Pendentes</p>
            <p className="text-2xl font-bold">{pendingSales}</p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Última Sincronização</p>
          <p className="text-sm font-medium">
            {lastSync
              ? formatDistanceToNow(lastSync, {
                  addSuffix: true,
                  locale: ptBR,
                })
              : "Nunca"}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={forceSync}
          disabled={!isOnline || isSyncing}
          className="w-full"
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar Agora
            </>
          )}
        </Button>

        <Button
          variant="destructive"
          onClick={clearOfflineCache}
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Limpar Cache Offline
        </Button>
      </div>
    )}
  </CardContent>
</Card>
```

#### **Lógica de Ativação:**

```typescript
// lib/offline-config.ts

export const OFFLINE_CONFIG_KEY = "chronos:offline-enabled";
export const OFFLINE_RISKS_ACK_KEY = "chronos:offline-risks-acknowledged";

export function isOfflineModeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(OFFLINE_CONFIG_KEY) === "true";
}

export function enableOfflineMode(risksAcknowledged: boolean): boolean {
  if (!risksAcknowledged) {
    throw new Error("Usuário deve reconhecer os riscos antes de ativar");
  }

  localStorage.setItem(OFFLINE_CONFIG_KEY, "true");
  localStorage.setItem(OFFLINE_RISKS_ACK_KEY, new Date().toISOString());

  // Registra Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js");
  }

  // Inicializa IndexedDB
  initializeOfflineDatabase();

  return true;
}

export function disableOfflineMode(): void {
  localStorage.setItem(OFFLINE_CONFIG_KEY, "false");

  // Remove Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  }

  // Limpa IndexedDB (opcional)
  // clearOfflineDatabase();
}
```

#### **Validação no SyncProvider:**

```typescript
// context/sync-context.tsx

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [offlineEnabled, setOfflineEnabled] = useState(false);

  useEffect(() => {
    // Verifica se modo offline está habilitado
    const enabled = isOfflineModeEnabled();
    setOfflineEnabled(enabled);

    // Se não estiver habilitado, não inicializa recursos offline
    if (!enabled) {
      console.log("Modo offline desabilitado. Funcionando apenas online.");
      return;
    }

    // ... resto da lógica de sincronização
  }, []);

  // Se offline mode não habilitado, não oferece funcionalidades offline
  if (!offlineEnabled) {
    return (
      <SyncContext.Provider
        value={{
          isOnline: true,
          isSyncing: false,
          pendingSyncs: 0,
          lastSync: null,
          cacheUsage: 0,
          forceSync: async () => {},
          addToSyncQueue: async () => {
            throw new Error(
              "Modo offline não está habilitado. Ative nas configurações."
            );
          },
        }}
      >
        {children}
      </SyncContext.Provider>
    );
  }

  // ... resto do provider com funcionalidades offline
}
```

---

## 🚨 Sistema de Alertas

### **1. Alerta: Modo Offline Ativo**

#### **Quando mostrar:**

- ✅ Conexão perdida (navigator.onLine === false)
- ✅ API não responde após 5 segundos (timeout)
- ✅ Erro de rede (ERR_INTERNET_DISCONNECTED)

#### **Design do Alerta:**

```tsx
<Alert variant="warning" className="sticky top-0 z-50">
  <WifiOff className="h-4 w-4" />
  <AlertTitle>Modo Offline Ativo</AlertTitle>
  <AlertDescription>
    Você está trabalhando offline. Vendas serão sincronizadas automaticamente
    quando a internet voltar.
    <div className="mt-2 text-xs">
      📦 {pendingSyncs} operações na fila | ⏱️ Última sincronização: {lastSync}
    </div>
  </AlertDescription>
</Alert>
```

#### **Comportamento:**

- Barra amarela no topo da tela (sticky)
- Atualiza contador de operações pendentes em tempo real
- Mostra hora da última sincronização bem-sucedida
- Pulsa suavemente para chamar atenção

---

### **2. Alerta: Estoque Insuficiente (Conflito Simultâneo)**

#### **Quando mostrar:**

- ❌ Venda offline consumiu produto com estoque 1
- ❌ Sincronização detectou venda simultânea de outro dispositivo
- ❌ Estoque negativo após resolução de conflito

#### **Design do Alerta:**

```tsx
<AlertDialog open={stockConflict}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle className="text-red-600">
        ⚠️ Conflito de Estoque Detectado
      </AlertDialogTitle>
      <AlertDialogDescription>
        <div className="space-y-3">
          <p>
            O produto <strong>{product.name}</strong> foi vendido
            simultaneamente em outro dispositivo.
          </p>

          <div className="bg-red-50 p-3 rounded">
            <p className="text-sm">
              • Estoque anterior: {conflict.previousStock}
              <br />• Sua venda: {conflict.yourSale} unidades
              <br />• Venda simultânea: {conflict.otherSale} unidades
              <br />
              <strong>• Estoque atual: {conflict.currentStock}</strong>
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Você pode cancelar esta venda ou confirmar mesmo com estoque
            negativo (será ajustado na próxima compra).
          </p>
        </div>
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogCancel onClick={cancelSale}>Cancelar Venda</AlertDialogCancel>
      <AlertDialogAction onClick={confirmNegativeStock}>
        Confirmar (Estoque Negativo)
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### **Comportamento:**

- Dialog modal (bloqueia ações até decisão)
- Mostra detalhes completos do conflito
- Opções claras: cancelar ou prosseguir
- Log auditável para reconciliação posterior

---

### **3. Alerta: Conexão Necessária (Cache Cheio)**

#### **Quando mostrar:**

- 🔴 IndexedDB atingiu 80% da quota (≈40MB de 50MB)
- 🔴 Fila de sincronização com >100 operações pendentes
- 🔴 Offline há mais de 24 horas

#### **Design do Alerta:**

```tsx
<Alert variant="destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Conexão Necessária Urgente</AlertTitle>
  <AlertDescription>
    <div className="space-y-2">
      <p>
        Seu armazenamento offline está quase cheio. Conecte-se à internet para
        sincronizar.
      </p>

      <Progress value={cacheUsage} className="h-2" />
      <p className="text-xs">
        {cacheUsage}% usado ({cacheSize}MB de {maxCache}MB)
      </p>

      <div className="mt-3 bg-red-900/20 p-2 rounded">
        <p className="text-xs font-semibold">
          ⚠️ Novas vendas serão bloqueadas em {remainingSpace}MB
        </p>
      </div>
    </div>
  </AlertDescription>
</Alert>
```

#### **Comportamento:**

- Alerta vermelho destrutivo (urgente)
- Barra de progresso visual do espaço usado
- Bloqueia novas operações ao atingir 95%
- Sugere ações: conectar WiFi/4G

---

### **4. Alerta: Trava de Segurança (Perda Iminente)**

#### **Quando mostrar:**

- 🛑 IndexedDB atingiu 95% da quota
- 🛑 Fila com >500 operações pendentes
- 🛑 Risco de perda de dados confirmado

#### **Design do Alerta:**

```tsx
<AlertDialog open={true} onOpenChange={() => {}}>
  <AlertDialogContent className="border-red-600 border-2">
    <AlertDialogHeader>
      <AlertDialogTitle className="text-red-600 text-xl">
        🚨 SISTEMA BLOQUEADO - PERDA DE DADOS IMINENTE
      </AlertDialogTitle>
      <AlertDialogDescription>
        <div className="space-y-4">
          <div className="bg-red-100 p-4 rounded border-2 border-red-600">
            <p className="font-semibold text-red-900">
              O sistema atingiu o limite de armazenamento offline.
            </p>
            <p className="text-sm text-red-800 mt-2">
              Sem sincronização há {offlineHours} horas.
              <br />
              {pendingOps} operações aguardando sincronização.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Ações necessárias:</p>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Conecte-se à internet IMEDIATAMENTE</li>
              <li>Aguarde sincronização completa (≈{syncTime}min)</li>
              <li>NÃO feche o navegador até concluir</li>
            </ol>
          </div>

          <div className="bg-yellow-50 p-3 rounded">
            <p className="text-xs text-yellow-900">
              💾 Backup automático será criado ao reconectar. Contate o suporte
              se precisar de ajuda.
            </p>
          </div>
        </div>
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <Button variant="destructive" disabled={!isOnline} onClick={forceSync}>
        {isOnline ? "🔄 Sincronizar Agora" : "📡 Aguardando Conexão..."}
      </Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### **Comportamento:**

- **Modal não pode ser fechado** (forçado)
- Interface bloqueada para novas operações
- Botão de sincronização só ativa quando online
- Salva log de emergência no localStorage
- Notificação push se browser suportar

---

### **5. Indicador Visual Contínuo (Status Bar)**

#### **Design:**

```tsx
<div className="fixed bottom-4 right-4 z-50">
  <Card
    className={cn(
      "p-3 shadow-lg transition-colors",
      isOnline ? "border-green-500" : "border-yellow-500"
    )}
  >
    <div className="flex items-center gap-3">
      {isOnline ? (
        <Wifi className="h-5 w-5 text-green-500" />
      ) : (
        <WifiOff className="h-5 w-5 text-yellow-500 animate-pulse" />
      )}

      <div className="text-sm">
        <p className="font-semibold">{isOnline ? "Online" : "Offline"}</p>
        <p className="text-xs text-muted-foreground">
          {pendingSyncs > 0 && <>{pendingSyncs} pendente(s)</>}
          {isSyncing && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Sincronizando...
            </span>
          )}
          {isOnline && pendingSyncs === 0 && <>✓ Tudo sincronizado</>}
        </p>
      </div>

      {cacheUsage > 70 && (
        <Badge variant="warning" className="ml-2">
          {cacheUsage}%
        </Badge>
      )}
    </div>
  </Card>
</div>
```

---

## 💾 Implementação PWA

### **1. Configuração Next.js PWA**

```bash
# Instalar dependências
npm install next-pwa workbox-webpack-plugin
npm install dexie dexie-react-hooks
npm install @tanstack/react-query
```

### **2. next.config.ts (PWA)**

```typescript
import withPWA from "next-pwa";

const config = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 ano
        },
      },
    },
    {
      urlPattern: /^https:\/\/api\.stripe\.com\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "stripe-api",
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /\/api\/(products|inventory|sales)\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "chronos-api",
        networkTimeoutSeconds: 5,
        plugins: [
          {
            cacheWillUpdate: async ({ response }) => {
              // Só cacheia respostas bem-sucedidas
              if (response.status === 200) {
                return response;
              }
              return null;
            },
          },
        ],
      },
    },
  ],
});

export default config;
```

### **3. manifest.json (PWA)**

```json
{
  "name": "Chronos PDV",
  "short_name": "Chronos",
  "description": "Sistema PDV que funciona offline",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0ea5e9",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshot-pdv.png",
      "sizes": "1280x720",
      "type": "image/png"
    }
  ],
  "categories": ["business", "productivity"],
  "shortcuts": [
    {
      "name": "PDV",
      "short_name": "Vendas",
      "url": "/dashboard/pdv",
      "icons": [{ "src": "/icon-pdv.png", "sizes": "96x96" }]
    },
    {
      "name": "Estoque",
      "url": "/dashboard/produtos-servicos",
      "icons": [{ "src": "/icon-inventory.png", "sizes": "96x96" }]
    }
  ]
}
```

---

## 🗄️ Esquema IndexedDB (Dexie.js)

### **Database Schema:**

```typescript
// lib/db.ts
import Dexie, { Table } from "dexie";

// Tipos
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  barcode?: string;
  image?: string;
  lastSync: Date;
}

interface PendingSale {
  id: string;
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentMethod: "cash" | "card" | "pix";
  createdAt: Date;
  synced: boolean;
  syncAttempts: number;
  conflictDetected?: boolean;
}

interface SyncQueue {
  id: string;
  operation: "CREATE" | "UPDATE" | "DELETE";
  entity: "sale" | "product" | "customer";
  data: any;
  timestamp: Date;
  retries: number;
  error?: string;
}

interface CacheMetadata {
  id: string;
  lastFullSync: Date;
  cacheSize: number;
  maxCacheSize: number;
  pendingOperations: number;
}

// Database
class ChronosDB extends Dexie {
  products!: Table<Product, string>;
  pendingSales!: Table<PendingSale, string>;
  syncQueue!: Table<SyncQueue, string>;
  metadata!: Table<CacheMetadata, string>;

  constructor() {
    super("chronos-offline-db");

    this.version(1).stores({
      products: "id, name, category, stock, lastSync",
      pendingSales: "id, userId, createdAt, synced",
      syncQueue: "id, timestamp, operation, entity, retries",
      metadata: "id",
    });
  }
}

export const db = new ChronosDB();

// Funções helper
export async function getCacheSize(): Promise<number> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
}

export async function getMaxCacheSize(): Promise<number> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.quota || 50 * 1024 * 1024; // 50MB default
  }
  return 50 * 1024 * 1024;
}

export async function getCacheUsagePercent(): Promise<number> {
  const used = await getCacheSize();
  const max = await getMaxCacheSize();
  return (used / max) * 100;
}
```

---

## 🔄 Sincronização Inteligente

### **1. Sync Manager (React Context)**

```typescript
// context/sync-context.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncs: number;
  lastSync: Date | null;
  cacheUsage: number;
  forceSync: () => Promise<void>;
  addToSyncQueue: (operation: any) => Promise<void>;
}

const SyncContext = createContext<SyncContextType | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncs, setPendingSyncs] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [cacheUsage, setCacheUsage] = useState(0);
  const { toast } = useToast();

  // Detecta mudanças de conexão
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "✅ Conexão Restaurada",
        description: "Sincronizando dados automaticamente...",
      });
      forceSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "⚠️ Modo Offline Ativo",
        description:
          "Você pode continuar trabalhando. Sincronizaremos quando voltar.",
        variant: "warning",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Verifica estado inicial
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Monitora fila de sincronização
  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await db.syncQueue.count();
      setPendingSyncs(count);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Monitora uso de cache
  useEffect(() => {
    const updateCacheUsage = async () => {
      const usage = await getCacheUsagePercent();
      setCacheUsage(Math.round(usage));

      // Alertas de cache
      if (usage > 80 && usage < 95) {
        toast({
          title: "⚠️ Cache Quase Cheio",
          description: `${Math.round(
            usage
          )}% usado. Conecte-se para sincronizar.`,
          variant: "warning",
        });
      } else if (usage >= 95) {
        toast({
          title: "🚨 CACHE CRÍTICO",
          description: "Sistema será bloqueado. Sincronize URGENTE!",
          variant: "destructive",
        });
      }
    };

    updateCacheUsage();
    const interval = setInterval(updateCacheUsage, 30000); // 30s
    return () => clearInterval(interval);
  }, []);

  // Sincronização automática
  const forceSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);

    try {
      const queue = await db.syncQueue.toArray();

      for (const item of queue) {
        try {
          // Envia para API
          const response = await fetch(`/api/sync/${item.entity}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              operation: item.operation,
              data: item.data,
            }),
          });

          if (response.ok) {
            // Remove da fila
            await db.syncQueue.delete(item.id);
          } else {
            // Incrementa tentativas
            await db.syncQueue.update(item.id, {
              retries: item.retries + 1,
              error: await response.text(),
            });

            // Falha após 3 tentativas
            if (item.retries >= 3) {
              toast({
                title: "❌ Erro de Sincronização",
                description: `Falha ao sincronizar ${item.entity}. Verifique os dados.`,
                variant: "destructive",
              });
            }
          }
        } catch (error) {
          console.error("Sync error:", error);
        }
      }

      // Atualiza metadata
      await db.metadata.put({
        id: "main",
        lastFullSync: new Date(),
        cacheSize: await getCacheSize(),
        maxCacheSize: await getMaxCacheSize(),
        pendingOperations: await db.syncQueue.count(),
      });

      setLastSync(new Date());

      toast({
        title: "✅ Sincronização Completa",
        description: `${queue.length} operações sincronizadas com sucesso.`,
      });
    } catch (error) {
      console.error("Force sync error:", error);
      toast({
        title: "❌ Erro na Sincronização",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Adiciona operação à fila
  const addToSyncQueue = async (operation: any) => {
    await db.syncQueue.add({
      id: crypto.randomUUID(),
      ...operation,
      timestamp: new Date(),
      retries: 0,
    });

    // Tenta sincronizar imediatamente se online
    if (isOnline) {
      forceSync();
    }
  };

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingSyncs,
        lastSync,
        cacheUsage,
        forceSync,
        addToSyncQueue,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) throw new Error("useSync must be used within SyncProvider");
  return context;
};
```

---

## ⚔️ Resolução de Conflitos

### **Estratégia: Last-Write-Wins com Validação**

```typescript
// lib/conflict-resolution.ts

export interface SaleConflict {
  localSale: PendingSale;
  serverSale: any;
  product: Product;
  stockBefore: number;
  stockAfter: number;
  conflict: "STOCK_NEGATIVE" | "DUPLICATE_SALE" | "PRICE_MISMATCH";
}

export async function detectConflicts(
  localSale: PendingSale
): Promise<SaleConflict[]> {
  const conflicts: SaleConflict[] = [];

  for (const item of localSale.items) {
    // Busca produto atualizado do servidor
    const serverProduct = await fetch(`/api/products/${item.productId}`).then(
      (r) => r.json()
    );
    const localProduct = await db.products.get(item.productId);

    if (!localProduct || !serverProduct) continue;

    // Verifica estoque
    const stockAfterSale = serverProduct.stock - item.quantity;

    if (stockAfterSale < 0) {
      conflicts.push({
        localSale,
        serverSale: null,
        product: localProduct,
        stockBefore: serverProduct.stock,
        stockAfter: stockAfterSale,
        conflict: "STOCK_NEGATIVE",
      });
    }

    // Verifica preço (variação >10% indica problema)
    const priceDiff =
      Math.abs(item.price - serverProduct.price) / serverProduct.price;
    if (priceDiff > 0.1) {
      conflicts.push({
        localSale,
        serverSale: null,
        product: localProduct,
        stockBefore: serverProduct.stock,
        stockAfter: stockAfterSale,
        conflict: "PRICE_MISMATCH",
      });
    }
  }

  return conflicts;
}

export async function resolveConflict(
  conflict: SaleConflict,
  resolution: "CANCEL" | "FORCE" | "ADJUST"
): Promise<void> {
  switch (resolution) {
    case "CANCEL":
      // Remove venda da fila
      await db.pendingSales.delete(conflict.localSale.id);
      await db.syncQueue.where({ data: conflict.localSale.id }).delete();
      break;

    case "FORCE":
      // Força venda mesmo com estoque negativo
      await db.syncQueue.add({
        id: crypto.randomUUID(),
        operation: "CREATE",
        entity: "sale",
        data: {
          ...conflict.localSale,
          forceNegativeStock: true,
        },
        timestamp: new Date(),
        retries: 0,
      });
      break;

    case "ADJUST":
      // Ajusta quantidade para estoque disponível
      const adjustedSale = {
        ...conflict.localSale,
        items: conflict.localSale.items.map((item) => ({
          ...item,
          quantity: Math.min(item.quantity, conflict.stockBefore),
        })),
      };
      await db.pendingSales.update(conflict.localSale.id, adjustedSale);
      break;
  }
}
```

---

## 📅 Roadmap de Desenvolvimento

### **Sprint 1: Fundação PWA (1 semana)**

```
Dia 1-2: Página de Configurações
- [ ] Criar UI de habilitação (Switch + Alertas)
- [ ] Lista dos 8 problemas possíveis
- [ ] Checkbox de confirmação de riscos
- [ ] Salvar preferência no localStorage
- [ ] Validação: só permite ativar se confirmar riscos

Dia 3-4: Setup PWA Condicional
- [ ] Instalar next-pwa
- [ ] Configurar manifest.json
- [ ] Service Worker só registra se habilitado
- [ ] Criar ícones (192x192, 512x512)

Dia 5-6: IndexedDB Condicional
- [ ] Setup Dexie.js
- [ ] Criar schemas (products, sales, queue)
- [ ] Só inicializa se modo offline habilitado
- [ ] Implementar funções CRUD offline

Dia 7: Testes
- [ ] Testar com modo offline desabilitado (erro correto)
- [ ] Testar habilitação + confirmação de riscos
- [ ] Testar instalação PWA no Chrome
- [ ] Validar bloqueio de operações offline quando desabilitado
```

### **Sprint 2: Sync Manager (1 semana)**

```
Dia 8-10: Context de Sincronização
- [ ] Criar SyncProvider
- [ ] Detectar online/offline
- [ ] Implementar fila de sync
- [ ] Auto-sync quando reconectar

Dia 11-12: Conflitos
- [ ] Detectar conflitos de estoque
- [ ] Dialogs de resolução
- [ ] Logs de auditoria

Dia 13-14: Testes E2E
- [ ] Simular offline
- [ ] Sincronização com conflitos
- [ ] Recovery após falhas
```

### **Sprint 3: Sistema de Alertas (3-4 dias)**

```
Dia 15-16: Alertas Básicos
- [ ] Alerta modo offline
- [ ] Status bar (online/offline)
- [ ] Badge de operações pendentes

Dia 17-18: Alertas Avançados
- [ ] Alerta cache cheio
- [ ] Trava de segurança 95%
- [ ] Conflito de estoque (dialog)
- [ ] Push notifications
```

### **Sprint 4: Otimização & Polimento (3 dias)**

```
Dia 19-20: Performance
- [ ] Compressão de cache
- [ ] Lazy load de imagens
- [ ] Batch sync (chunks de 50)

Dia 21: Testes Finais
- [ ] Teste com 500 produtos
- [ ] Teste com 100 vendas offline
- [ ] Teste cache 95% cheio
- [ ] Teste múltiplos devices
```

**Total:** ~3 semanas de desenvolvimento

---

## 🧪 Testes e Validação

### **Cenários de Teste Críticos:**

#### **1. Venda Offline Simples**

```
1. Desconectar WiFi
2. Adicionar 3 produtos ao carrinho
3. Finalizar venda (Dinheiro)
4. Verificar venda em IndexedDB
5. Reconectar internet
6. Validar sincronização automática
7. Confirmar venda no PostgreSQL
```

#### **2. Conflito de Estoque**

```
1. Device A: Offline, vende produto X (estoque: 1)
2. Device B: Online, vende produto X simultaneamente
3. Device A: Reconecta
4. Sistema detecta conflito
5. Mostra dialog de resolução
6. Usuário escolhe ação (cancelar/forçar)
7. Valida estado final do estoque
```

#### **3. Cache Cheio**

```
1. Preencher IndexedDB com 45MB de dados
2. Tentar adicionar mais vendas
3. Verificar alerta de 80%
4. Continuar até 95%
5. Validar bloqueio de novas operações
6. Sincronizar e liberar espaço
7. Confirmar operações voltam ao normal
```

#### **4. Recuperação de Falha**

```
1. Offline com 50 vendas pendentes
2. Fechar navegador abruptamente
3. Reabrir aplicação
4. Validar vendas ainda em IndexedDB
5. Reconectar
6. Sincronizar tudo sem perda
```

### **Ferramentas de Teste:**

```bash
# Chrome DevTools
- Application > Storage > IndexedDB
- Application > Service Workers
- Network > Offline (simular)

# Lighthouse PWA Audit
npx lighthouse https://chronos.com.br --view

# Testes automatizados (Playwright)
npx playwright test tests/offline-sync.spec.ts
```

---

## 📊 Métricas de Sucesso

| Métrica               | Meta  | Como Medir                            |
| --------------------- | ----- | ------------------------------------- |
| **Uptime Offline**    | 99.9% | Vendas completadas offline / total    |
| **Sync Success Rate** | >98%  | Syncs bem-sucedidos / tentativas      |
| **Conflitos**         | <2%   | Conflitos detectados / vendas totais  |
| **Tempo de Sync**     | <30s  | Tempo médio de sincronização completa |
| **Cache Hit Rate**    | >80%  | Requisições servidas do cache         |
| **Perda de Dados**    | 0     | Vendas perdidas (objetivo zero)       |

---

## 🎯 Posicionamento de Marketing

### **Mensagens-Chave:**

1. **Landing Page:**

   > "Venda sempre, mesmo sem internet. O Chronos funciona 100% offline."

2. **Google Ads:**

   > "PDV que funciona offline | Nunca perca uma venda por falta de internet"

3. **Pitch Vendas:**

   > "Seu concorrente perde vendas quando a internet cai. Você não."

4. **Diferencial vs Bling:**
   > "Bling precisa de internet o tempo todo. Chronos funciona sempre."

---

## 🚀 Go-Live Checklist

### **Pré-Lançamento:**

- [ ] PWA instalável em Chrome/Edge/Safari
- [ ] Service Worker ativo e cacheando
- [ ] IndexedDB funcionando (500 produtos)
- [ ] Sync automático testado (100 vendas)
- [ ] Todos os 4 alertas funcionando
- [ ] Trava de segurança 95% testada
- [ ] Documentação de suporte criada
- [ ] FAQ offline publicado

### **Dia do Lançamento:**

- [ ] Monitoramento ativo (Sentry/LogRocket)
- [ ] Suporte preparado para dúvidas offline
- [ ] Vídeo tutorial "Como usar offline" no YouTube
- [ ] Email para clientes explicando feature

---

## 📚 Recursos Adicionais

### **Documentação Oficial:**

- [PWA Builder](https://www.pwabuilder.com/)
- [Workbox (Google)](https://developers.google.com/web/tools/workbox)
- [Dexie.js Docs](https://dexie.org/)
- [Background Sync API](https://web.dev/periodic-background-sync/)

### **Exemplos de Código:**

- [GitHub: PWA Examples](https://github.com/GoogleChrome/samples/tree/gh-pages/service-worker)
- [Next.js PWA Template](https://github.com/shadowwalker/next-pwa)

---

**Documento mantido por:** Equipe Chronos  
**Última atualização:** 16/11/2025  
**Próxima revisão:** Após implementação Sprint 1

---

_"A internet é opcional. Vender não."_ - Chronos PDV
