

# Plano: Corrigir Visualização e Edição de Acréscimo/Desconto

## Problema Identificado

Na página `/vendas/minhas-vendas/editar/:id`:

1. **Acréscimo não é exibido**: Não há nenhuma seção mostrando o valor do crédito (R$ 6.300) que a venda possui
2. **Botão de Crédito não aparece**: A condição para exibir o botão não contempla o caso de edição de um crédito existente
3. **Botão de Desconto não aparece**: A lógica atual oculta o botão quando há crédito, mas não oferece opção de remover o crédito para então aplicar desconto
4. **Componente VendaResumo não é usado**: O resumo visual com totais e crédito não está na página de edição

---

## Análise da Venda em Questão

```
ID: 20fbc47e-71a8-43f0-ba19-b549e9b4c24a
Cliente: Ducatti Engenharia Ltda
Valor Venda: R$ 22.300
Valor Crédito: R$ 6.300 (81.82%)
Desconto nos Produtos: R$ 0 (nenhum)
```

---

## Lógica Atual (Problemática)

```tsx
// Botão de Desconto - só aparece se NÃO há crédito
{produtosFormatados.length > 0 && valorCreditoAtual === 0 && (
  <Button>Adicionar/Editar Desconto</Button>
)}

// Botão de Crédito - só aparece se NÃO há desconto
{produtosFormatados.length > 0 && !temDesconto && (
  <Button>Adicionar/Editar Crédito</Button>
)}
```

O problema: quando há crédito (`valorCreditoAtual > 0`), o botão de crédito deveria aparecer para permitir **editar** o crédito existente, mas a lógica não considera isso de forma visível.

---

## Solução Proposta

### 1. Adicionar Componente VendaResumo

Incluir o `VendaResumo` na página de edição para exibir:
- Valor dos produtos
- Valor do frete
- Desconto aplicado (se houver)
- **Crédito aplicado** (se houver) - com botão para remover
- Total da venda

### 2. Ajustar Lógica dos Botões

Modificar as condições para:
- **Botão Desconto**: Mostrar se não há crédito (manter)
- **Botão Crédito**: Mostrar se não há desconto OU se já tem crédito (permitir edição)

```tsx
// Botão de Desconto - só se NÃO há crédito
{produtosFormatados.length > 0 && valorCreditoAtual === 0 && (
  <Button onClick={() => setDescontoModalOpen(true)}>
    {temDesconto ? 'Editar Desconto' : 'Adicionar Desconto'}
  </Button>
)}

// Botão de Crédito - se não há desconto OU já tem crédito
{produtosFormatados.length > 0 && (!temDesconto || valorCreditoAtual > 0) && (
  <Button onClick={() => setCreditoModalOpen(true)}>
    {valorCreditoAtual > 0 ? 'Editar Crédito' : 'Adicionar Crédito'}
  </Button>
)}
```

### 3. Adicionar Handler para Remover Crédito

Criar função para remover o crédito diretamente do resumo:

```tsx
const handleRemoverCredito = async () => {
  if (!id) return;
  
  try {
    await supabase
      .from('vendas')
      .update({ valor_credito: 0, percentual_credito: 0 })
      .eq('id', id);
    
    setVenda(prev => prev ? { ...prev, valor_credito: 0, percentual_credito: 0 } : null);
    
    toast({
      title: "Crédito removido",
      description: "O crédito foi removido da venda"
    });
  } catch (error) {
    toast({
      variant: "destructive",
      title: "Erro",
      description: "Não foi possível remover o crédito"
    });
  }
};
```

---

## Alterações no Arquivo

### `src/pages/vendas/MinhasVendasEditar.tsx`

| Linha | Alteração |
|-------|-----------|
| Imports | Adicionar import do `VendaResumo` |
| ~255 | Adicionar função `handleRemoverCredito` |
| ~700 | Renderizar o `VendaResumo` antes dos botões |
| ~704-728 | Ajustar lógica de exibição dos botões |

---

## Resultado Visual Esperado

```text
ANTES:
┌─────────────────────────────────────┐
│ Produtos da Venda                   │
│ ┌───────────────────────────────┐   │
│ │ Tabela de Produtos           │   │
│ └───────────────────────────────┘   │
│                                     │
│                    [Salvar]         │  <- Nenhum botão de crédito/desconto!
└─────────────────────────────────────┘

DEPOIS:
┌─────────────────────────────────────┐
│ Produtos da Venda                   │
│ ┌───────────────────────────────┐   │
│ │ Tabela de Produtos           │   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Resumo da Venda               │ │
│ │ Valor Produtos: R$ 16.000,00  │ │
│ │ Valor Frete: R$ 450,00        │ │
│ │ Crédito: +R$ 6.300 (81.82%) [X]│ │
│ │ ─────────────────────────────  │ │
│ │ Total: R$ 22.750,00           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Editar Crédito]          [Salvar] │
└─────────────────────────────────────┘
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/vendas/MinhasVendasEditar.tsx` | Importar VendaResumo, adicionar handler remover crédito, renderizar resumo, ajustar lógica botões |

---

## Impacto

- **Visibilidade**: Usuário vê claramente o acréscimo/crédito aplicado
- **Edição**: Botão "Editar Crédito" aparece quando há crédito existente
- **Remoção**: Botão X no resumo permite remover o crédito
- **Consistência**: Mesma experiência visual da página de nova venda

