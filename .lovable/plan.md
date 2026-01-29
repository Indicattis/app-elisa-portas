
# Plano: Corrigir Botões e Edição de Quantidade na Página de Edição de Venda

## Resumo

1. Substituir os botões da página de edição para usar o mesmo estilo sofisticado da página de nova venda
2. Verificar e garantir que a edição de quantidade funciona corretamente

---

## Problema Identificado

### 1. Estilo dos Botões
- **Página Nova Venda**: Usa componente `ProductButton` com estilo gradiente azul sofisticado
- **Página Edição**: Usa `Button` padrão com estilos diferentes

### 2. Edição de Quantidade
- O código atual já passa `onUpdateQuantidade` para `ProdutosVendaTable`
- Preciso verificar se está funcionando corretamente

---

## Alterações Necessárias

### Arquivo: `src/pages/vendas/VendaEditarMinimalista.tsx`

#### 1. Adicionar componente ProductButton (igual ao da nova venda)

Adicionar antes do return principal:

```typescript
const ProductButton = ({ 
  label, 
  onClick 
}: { 
  label: string; 
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex items-center gap-2 h-10 px-4 rounded-lg
               bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/25 text-blue-200
               hover:from-blue-500/20 hover:to-blue-600/10 hover:text-white hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/10
               transition-all duration-200"
  >
    <Plus className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
    <span className="text-sm font-medium">{label}</span>
  </button>
);
```

#### 2. Substituir os botões de adicionar produtos (linhas 444-495)

**De:**
```typescript
<Button 
  type="button"
  size="sm"
  onClick={() => {...}}
>
  <Plus className="w-3.5 h-3.5 mr-1.5" />
  Porta de Enrolar
</Button>
```

**Para:**
```typescript
<ProductButton 
  label="Porta de Enrolar"
  onClick={() => {
    setTipoInicial('porta_enrolar');
    setPermitirTrocaTipo(false);
    setShowProdutoForm(true);
  }}
/>
```

#### 3. Aplicar a todos os 4 botões de produto

| Botão Atual | Novo Componente |
|-------------|-----------------|
| Porta de Enrolar | `<ProductButton label="Porta de Enrolar" ... />` |
| Porta Social | `<ProductButton label="Porta Social" ... />` |
| Pintura Eletrostática | `<ProductButton label="Pintura Eletrostática" ... />` |
| Catálogo | `<ProductButton label="Catálogo" ... />` |

---

## Resumo de Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/vendas/VendaEditarMinimalista.tsx` | Adicionar componente `ProductButton` |
| `src/pages/vendas/VendaEditarMinimalista.tsx` | Substituir 4 botões pelo novo componente |

---

## Resultado Esperado

1. Os botões na página de edição terão o mesmo visual sofisticado da página de nova venda
2. A edição de quantidade já está implementada e deve funcionar (o código já está correto)

---

## Comparação Visual

### Antes (Edição):
```text
[+ Porta de Enrolar] [+ Porta Social] [+ Pintura Eletrostática] [+ Catálogo]
   ↑ Botões simples com variant="outline"
```

### Depois (igual à Nova Venda):
```text
[+ Porta de Enrolar] [+ Porta Social] [+ Pintura Eletrostática] [+ Catálogo]
   ↑ Botões com gradiente azul sofisticado e efeitos hover
```
