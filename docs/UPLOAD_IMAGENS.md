# 📸 Sistema de Upload de Imagens

## Resumo

Implementado sistema de upload de imagens para produtos e serviços com geração automática de avatares usando a primeira letra do nome.

## 🎯 Funcionalidades Implementadas

### 1. Upload de Arquivos

- **Localização**: `src/app/dashboard/produtos-servicos/page.tsx`
- **Input**: Campo de upload aceita imagens (`accept="image/*"`)
- **Conversão**: Imagens são convertidas para Base64 automaticamente
- **Preview**: Visualização em tempo real da imagem selecionada

### 2. Avatar com Primeira Letra

- **Fallback Automático**: Se nenhuma imagem for enviada, gera avatar automaticamente
- **Design**: Avatar colorido com a primeira letra do nome do produto/serviço
- **Cores**: 8 cores diferentes atribuídas baseadas no nome (consistente)

### 3. Componente ProductImage

- **Localização**: `src/components/ui/product-image.tsx`
- **Função**: Renderiza imagens ou avatares de forma inteligente
- **Responsivo**: Tamanho configurável via props

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

#### `src/lib/letter-avatar.ts`

Utilitários para geração e parsing de avatares:

```typescript
// Gera string de avatar com primeira letra e cor
generateLetterAvatar(name: string): string

// Verifica se uma URL é um avatar de letra
isLetterAvatar(imageUrl: string): boolean

// Extrai letra e cor de um avatar
parseLetterAvatar(imageUrl: string): { letter: string; color: string } | null
```

**Formato do Avatar**: `letter-avatar:{LETRA}:{COR}`

- Exemplo: `letter-avatar:N:bg-blue-500`

**Cores Disponíveis**:

- `bg-blue-500`, `bg-green-500`, `bg-yellow-500`, `bg-red-500`
- `bg-purple-500`, `bg-pink-500`, `bg-indigo-500`, `bg-teal-500`

#### `src/components/ui/product-image.tsx`

Componente reutilizável para renderizar imagens de produtos:

```typescript
interface ProductImageProps {
  imageUrl: string; // URL da imagem ou string de avatar
  name: string; // Nome do produto (para fallback)
  className?: string; // Classes CSS customizadas
  size?: number; // Tamanho em pixels (padrão: 40)
}
```

**Comportamento**:

1. Se `imageUrl` começa com `letter-avatar:` → Renderiza avatar colorido
2. Caso contrário → Renderiza imagem com Next.js Image

### Arquivos Modificados

#### `src/app/dashboard/produtos-servicos/page.tsx`

**1. Imports Adicionados** (linhas ~75-76):

```typescript
import { generateLetterAvatar } from "@/lib/letter-avatar";
import { ProductImage } from "@/components/ui/product-image";
```

**2. Input de Upload** (linha ~503):

```tsx
<Input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        field.onChange(base64);
        setPreviewUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  }}
/>
```

**3. Geração Automática de Avatar** (linha ~825):

```typescript
const onSubmit = (values: Product | Service) => {
  // Se não houver imagem, gera avatar com primeira letra
  if (!values.imageUrl || values.imageUrl.trim() === "") {
    values.imageUrl = generateLetterAvatar(values.name);
  }
  // ... resto do código
};
```

**4. Visualização nos Cards** (linha ~133):

```tsx
<ProductImage
  imageUrl={item.imageUrl || ""}
  name={item.name}
  size={200}
  className="w-full h-full rounded-t-lg"
/>
```

**5. Visualização no Dialog de Detalhes** (linha ~216):

```tsx
<ProductImage
  imageUrl={selectedItem.imageUrl || ""}
  name={selectedItem.name}
  size={300}
  className="w-full h-full rounded-md"
/>
```

## 🔄 Fluxo de Funcionamento

### Cenário 1: Usuário Faz Upload de Imagem

```
1. Usuário clica no input de arquivo
2. Seleciona uma imagem do computador
3. FileReader converte para Base64
4. Base64 é armazenado no campo imageUrl
5. Preview é exibido automaticamente
6. Ao salvar, Base64 é enviado para API
7. Imagem Base64 é salva no banco SQLite
```

### Cenário 2: Usuário Não Envia Imagem

```
1. Usuário deixa campo de imagem vazio
2. Preenche apenas o nome: "Notebook Dell"
3. Ao clicar em salvar, onSubmit detecta imageUrl vazio
4. Chama generateLetterAvatar("Notebook Dell")
5. Gera: "letter-avatar:N:bg-blue-500"
6. ProductImage renderiza avatar azul com letra "N"
```

## 🎨 Exemplo Visual

### Avatar Gerado Automaticamente

```
Nome: "Notebook Dell"
Resultado: Avatar azul com letra "N"

Nome: "Camiseta Premium"
Resultado: Avatar verde com letra "C"

Nome: "Serviço de Consultoria"
Resultado: Avatar roxo com letra "S"
```

### Armazenamento no Banco

```sql
-- Com imagem enviada
imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANS..."

-- Sem imagem (avatar automático)
imageUrl: "letter-avatar:N:bg-blue-500"
```

## ✅ Benefícios

1. **UX Melhorada**: Usuário não precisa buscar URLs de imagens na internet
2. **Fallback Visual**: Todo produto tem uma representação visual, mesmo sem foto
3. **Consistência**: Mesmos produtos sempre têm a mesma cor de avatar
4. **Performance**: Base64 evita requisições externas para imagens
5. **Simplicidade**: Código limpo e reutilizável

## 🔧 Possíveis Melhorias Futuras

1. **Otimização de Tamanho**: Comprimir imagens antes de converter para Base64
2. **Armazenamento em Disco**: Salvar arquivos no filesystem em vez de Base64
3. **CDN**: Usar serviço externo (Cloudinary, AWS S3) para produção
4. **Limites de Upload**: Validar tamanho máximo de arquivo (ex: 2MB)
5. **Formatos**: Restringir apenas PNG, JPG, WEBP
6. **Crop/Resize**: Editor de imagem para usuário ajustar antes de salvar

## 🧪 Como Testar

1. **Teste de Upload**:

   - Acesse http://localhost:9002/dashboard/produtos-servicos
   - Clique em "Adicionar Produto"
   - Preencha nome: "Produto Teste"
   - Clique no input de arquivo e selecione uma imagem
   - Verifique o preview
   - Salve e confirme que imagem aparece no card

2. **Teste de Avatar Automático**:

   - Clique em "Adicionar Produto"
   - Preencha nome: "Avatar Teste"
   - **Não** selecione nenhuma imagem
   - Salve
   - Confirme que aparece avatar colorido com letra "A"

3. **Teste de Edição**:
   - Edite um produto com avatar
   - Faça upload de uma imagem real
   - Salve e confirme substituição
   - Edite novamente e remova a imagem (limpar campo)
   - Salve e confirme que avatar volta

## 📊 Status

- ✅ Upload de arquivos funcionando
- ✅ Conversão Base64 automática
- ✅ Geração de avatar com primeira letra
- ✅ Preview em tempo real
- ✅ Componente reutilizável
- ✅ 8 cores diferentes para avatares
- ✅ Integração com banco SQLite
- ✅ Sem erros de compilação

## 🔒 Segurança

**Atual**: Imagens são armazenadas como Base64 no banco de dados

- ✅ Não expõe sistema de arquivos
- ✅ Não requer configuração de servidor de arquivos
- ⚠️ Aumenta tamanho do banco (Base64 é ~33% maior que binário)

**Recomendações para Produção**:

- Implementar validação de tipo MIME no backend
- Limitar tamanho máximo de upload
- Escanear imagens para malware
- Usar CDN externa para escala

---

**Data**: ${new Date().toLocaleDateString('pt-BR')}
**Versão**: 1.0.0
**Autor**: Sistema de Upload de Imagens - Chronos App
