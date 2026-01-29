
# Plano: Adicionar Botão "Editar Desconto" na Página de Edição de Venda

## Problema Identificado

Na página `/vendas/minhas-vendas/editar/:id`, a lógica atual dos botões de desconto e crédito é:

| Condição | Botão Exibido |
|----------|---------------|
| `temDesconto = false` e `valorCredito = 0` | "Adicionar Desconto" ✅ + "Adicionar Crédito" ✅ |
| `temDesconto = false` e `valorCredito > 0` | ❌ Nenhum botão de desconto + "Editar Crédito" ✅ |
| `temDesconto = true` e `valorCredito = 0` | ❌ Nenhum botão de desconto + ❌ Nenhum botão de crédito |
| `temDesconto = true` e `valorCredito > 0` | ❌ Nenhum botão de desconto + ❌ Nenhum botão de crédito |

**Problema**: Quando a venda já tem desconto aplicado (`temDesconto = true`), não há forma de editar ou ajustar o desconto existente.

---

## Solução

Adicionar lógica para exibir **"Editar Desconto"** quando já existe desconto aplicado, permitindo ao usuário ajustar os descontos existentes respeitando as mesmas regras.

### Nova Lógica dos Botões

| Condição | Botão Exibido |
|----------|---------------|
| `temDesconto = false` e `valorCredito = 0` | "Adicionar Desconto" + "Adicionar Crédito" |
| `temDesconto = false` e `valorCredito > 0` | "Adicionar Desconto" (desabilitado c/ tooltip) + "Editar Crédito" |
| **`temDesconto = true`** e `valorCredito = 0` | **"Editar Desconto"** + (crédito bloqueado) |
| `temDesconto = true` e `valorCredito > 0` | (conflito - não deveria ocorrer) |

---

## Alterações Técnicas

### Arquivo: `src/pages/vendas/MinhasVendasEditar.tsx`

#### Linhas 703-716 (Botão de Desconto)

**Código Atual:**
```tsx
{produtosFormatados.length > 0 && valorCreditoAtual === 0 && (
  <Button 
    type="button"
    size="sm"
    variant="outline"
    onClick={() => setDescontoModalOpen(true)}
    disabled={isSaving}
    className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
  >
    <Percent className="w-3.5 h-3.5 mr-1.5" />
    Adicionar Desconto
  </Button>
)}
```

**Código Novo:**
```tsx
{produtosFormatados.length > 0 && valorCreditoAtual === 0 && (
  <Button 
    type="button"
    size="sm"
    variant="outline"
    onClick={() => setDescontoModalOpen(true)}
    disabled={isSaving}
    className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
  >
    <Percent className="w-3.5 h-3.5 mr-1.5" />
    {temDesconto ? 'Editar Desconto' : 'Adicionar Desconto'}
  </Button>
)}
```

Esta alteração simples:
1. Mantém a mesma condição de exibição (`valorCreditoAtual === 0`)
2. Altera o texto do botão dinamicamente baseado em `temDesconto`
3. Reutiliza o mesmo `DescontoVendaModal` que já existe e respeita todas as regras de desconto

---

## Comportamento do DescontoVendaModal

O modal já está preparado para lidar com descontos existentes:

- **Linha 55-67**: Calcula `descontoAtual` somando todos os descontos já aplicados
- **Linha 69**: Calcula `percentualDescontoAtual` para exibição
- **Linha 170-172**: Exibe o desconto atual no card "Desconto Atual"
- **Linha 104-136**: Ao aplicar, **soma** o novo desconto ao existente

Isso significa que o modal permite adicionar **mais desconto** sobre o existente, respeitando os limites configurados.

---

## Fluxo Visual

```text
ANTES:
┌─────────────────────────────────────────────────────────────┐
│ [+ Porta Enrolar] [+ Porta Social] [+ Catálogo] ...         │
│                                                             │
│ Produtos Adicionados                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Porta de Enrolar 3x4m  R$ 2.500,00  (-5%) R$ 2.375,00   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                                            [Salvar]         │  <- Sem botão de desconto!
└─────────────────────────────────────────────────────────────┘

DEPOIS:
┌─────────────────────────────────────────────────────────────┐
│ [+ Porta Enrolar] [+ Porta Social] [+ Catálogo] ...         │
│                                                             │
│ Produtos Adicionados                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Porta de Enrolar 3x4m  R$ 2.500,00  (-5%) R$ 2.375,00   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                        [% Editar Desconto]   [Salvar]       │  <- Botão visível!
└─────────────────────────────────────────────────────────────┘
```

---

## Regras de Desconto Respeitadas

O `DescontoVendaModal` já implementa todas as regras de negócio:

1. **Limite base**: 3% para pagamentos que não são cartão de crédito
2. **Limite presencial**: +5% adicional para venda presencial
3. **Senha do responsável**: Necessária para exceder o limite base (até +5%)
4. **Senha master**: Necessária para descontos acima do limite máximo

Essas regras são calculadas em `src/utils/descontoVendasRules.ts` e validadas pelo modal.

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/vendas/MinhasVendasEditar.tsx` | Alterar texto do botão de desconto para exibir "Editar Desconto" quando `temDesconto = true` |

---

## Impacto

- **UX**: Usuário consegue ajustar descontos de vendas existentes
- **Consistência**: Mesmo comportamento do botão "Editar Crédito"
- **Regras**: Todas as validações de desconto continuam sendo aplicadas
- **Baixo risco**: Alteração mínima de código (apenas texto do botão)
