
## Plano: Adicionar Tipo de Entrega "Manutenção" e Remover Botão "Serviço"

### Visão Geral

Modificar a página `/vendas/minhas-vendas/nova` (`VendaNovaMinimalista.tsx`) para:
1. Adicionar "MANUTENÇÃO" como terceiro tipo de entrega no RadioGroup
2. Remover o botão "Serviço" da seção de adição de produtos

Esta mudança consolida a manutenção como um tipo de entrega/serviço em vez de um produto individual.

---

### Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/vendas/VendaNovaMinimalista.tsx` | Modificar |

---

### Parte 1: Adicionar Ícone de Manutenção

Atualizar os imports do Lucide para incluir um ícone apropriado para manutenção:

**Linha 16 - Adicionar ícone `Settings`:**

```typescript
import { Plus, CalendarIcon, Percent, CheckCircle2, ShieldCheck, Lock, Package, CreditCard, FileText, Truck, Wrench, Settings } from 'lucide-react';
```

---

### Parte 2: Alterar Grid do RadioGroup

Alterar o layout do RadioGroup de 2 colunas para 3 colunas:

**Linha 811:**

```typescript
className="grid grid-cols-3 gap-3"
```

---

### Parte 3: Adicionar Opção "Manutenção"

Adicionar a terceira opção de tipo de entrega após "Entrega" (após linha 853):

```typescript
<label
  htmlFor="tipo-manutencao"
  className={cn(
    "flex items-center justify-center gap-3 p-4 rounded-lg cursor-pointer transition-all duration-200",
    "border-2",
    formData.tipo_entrega === "manutencao"
      ? "bg-gradient-to-r from-blue-500/20 to-blue-600/10 border-blue-400/50 shadow-lg shadow-blue-500/20"
      : "bg-blue-500/5 border-blue-500/20 hover:border-blue-400/40 hover:bg-blue-500/10"
  )}
>
  <RadioGroupItem value="manutencao" id="tipo-manutencao" className="sr-only" />
  <Settings className={cn(
    "w-5 h-5",
    formData.tipo_entrega === "manutencao" ? "text-blue-400" : "text-blue-300/50"
  )} />
  <span className={cn(
    "text-sm font-medium",
    formData.tipo_entrega === "manutencao" ? "text-blue-100" : "text-blue-200/70"
  )}>Manutenção</span>
</label>
```

---

### Parte 4: Remover Botão "Serviço"

Remover o ProductButton de "Serviço" (linhas 717-726):

**Antes:**
```typescript
<ProductButton 
  label="Pintura Eletrostática"
  onClick={() => {...}}
/>
<ProductButton 
  label="Serviço"
  onClick={() => {...}}
/>
<ProductButton 
  label="Catálogo"
  onClick={() => setAcessoriosModalOpen(true)}
/>
```

**Depois:**
```typescript
<ProductButton 
  label="Pintura Eletrostática"
  onClick={() => {...}}
/>
<ProductButton 
  label="Catálogo"
  onClick={() => setAcessoriosModalOpen(true)}
/>
```

---

### Resumo Visual das Mudanças

**Tipos de Entrega (Antes):**
```text
┌─────────────┬─────────────┐
│ Instalação  │   Entrega   │
└─────────────┴─────────────┘
```

**Tipos de Entrega (Depois):**
```text
┌─────────────┬─────────────┬─────────────┐
│ Instalação  │   Entrega   │ Manutenção  │
└─────────────┴─────────────┴─────────────┘
```

**Botões de Produto (Antes):**
```text
[Porta de Enrolar] [Porta Social] [Pintura Eletrostática] [Serviço] [Catálogo]
```

**Botões de Produto (Depois):**
```text
[Porta de Enrolar] [Porta Social] [Pintura Eletrostática] [Catálogo]
```

---

### Resultado Esperado

1. O usuário pode selecionar "Manutenção" como tipo de entrega
2. O botão "Serviço" não aparece mais na seção de produtos
3. O layout permanece consistente com o tema azul minimalista
4. O valor `manutencao` é salvo no campo `tipo_entrega` da venda
