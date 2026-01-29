
# Plano: Simplificar Tela de Estoque no Administrativo/Compras

## Objetivo

Remover colunas e campos das rotas de estoque no módulo Administrativo/Compras, focando apenas nos dados relevantes para o setor de Compras.

---

## Alterações

### 1. Arquivo: `src/pages/administrativo/EstoqueMinimalista.tsx`

Remover da tabela as colunas:

| Coluna a Remover | Linha da TableHead | Linha da TableCell |
|------------------|--------------------|--------------------|
| **Estoque** | 444 | 530-549 |
| **Custo** | 445 | 551-557 |
| **Ações** | 446 | 559-571 |

**Ajustes necessários:**
- Remover as 3 `TableHead` (linhas 444-446)
- Remover as 3 `TableCell` correspondentes (linhas 530-571)
- Ajustar o `colSpan` de 8 para 5 nas mensagens de "Carregando" e "Nenhum produto encontrado" (linhas 452 e 463)
- Remover o estado e modal de movimentação (já que as ações são removidas):
  - `movimentacaoModal` state (linha 28)
  - `handleMovimentar` function (linhas 105-120)
  - `handleOpenMovimentacao` function (linhas 122-125)
  - Import do `MovimentacaoModal` (linha 15)
  - Componente `MovimentacaoModal` no final (linhas 581-588)

---

### 2. Arquivo: `src/pages/administrativo/EstoqueEditMinimalista.tsx`

Remover os seguintes campos do formulário:

| Campo a Remover | Localização Aproximada |
|-----------------|------------------------|
| **Categoria** | linhas 242-259 |
| **Subcategoria** | linhas 261-278 |
| **Fornecedor** | linhas 280-297 |
| **Quantidade Atual** | linhas 299-309 |
| **Quantidade Ideal** | linhas 311-321 |
| **Unidade** | linhas 323-341 |
| **Custo Unitário** | linhas 343-353 |
| **Peso por Porta** | linhas 355-365 |

**Ajustes necessários:**
- Remover os campos do `formData` state inicial
- Remover do `handleSubmit` os dados que não serão mais enviados
- Manter os campos de produção (Setor de Produção, Requer Pintura, Cálculo Automático)

---

## Resultado Esperado

### Tabela de Estoque (`/administrativo/compras/estoque`)

| SKU | Produto | Categoria | Setor | Pintura |
|-----|---------|-----------|-------|---------|

### Formulário de Edição (`/administrativo/compras/estoque/editar-item/:id`)

Campos mantidos:
- Nome do Produto
- Descrição
- Setor de Produção
- Requer Pintura
- Configurações de Cálculo Automático
- Regras de Etiqueta

---

## Arquivos Afetados

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/administrativo/EstoqueMinimalista.tsx` | Remover colunas Estoque, Custo e Ações |
| `src/pages/administrativo/EstoqueEditMinimalista.tsx` | Remover 8 campos do formulário |
