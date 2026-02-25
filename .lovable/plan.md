

# Adicionar despesas e status "em teste" na pagina DRE mensal

## Resumo

Adicionar na pagina `/direcao/dre/:mes` a possibilidade de criar novas despesas fixas e variaveis diretamente, e um campo de status para cada despesa indicando se ela esta "decretada" (bolinha verde) ou "em teste" (bolinha amarela).

## Mudancas

### 1. Migracao de banco de dados

Adicionar coluna `tipo_status` na tabela `despesas_mensais` com valores `decretada` (default) ou `em_teste`:

```sql
ALTER TABLE despesas_mensais
ADD COLUMN tipo_status text NOT NULL DEFAULT 'decretada';
```

### 2. Arquivo: `src/pages/direcao/DREMesDirecao.tsx`

**Adicionar funcionalidade de criar despesas:**
- Novo estado para controlar o formulario inline de nova despesa (nome, valor, tipo_status)
- Botao "+" no cabecalho de cada secao (Fixas e Variaveis) que abre um formulario inline
- Ao salvar, insere na tabela `despesas_mensais` com o `mes`, `modalidade` (fixa/variavel) e `tipo_status` correspondentes
- Recarrega os dados apos inserir

**Adicionar indicador visual de status:**
- Ao lado de cada despesa, exibir uma bolinha (dot) colorida:
  - Verde (`bg-emerald-400`) para `decretada`
  - Amarela (`bg-amber-400`) para `em_teste`
- Clicar na bolinha alterna o status entre decretada e em teste (toggle)

**Adicionar opcao de excluir despesa:**
- Icone de lixeira ao lado de cada despesa para permitir exclusao

### Estrutura visual

```text
Despesas Fixas                          [+ Adicionar]
  (verde) Aluguel ...................... R$ 5.000,00  [x]
  (amarelo) Novo Software ............. R$ 800,00    [x]
  Total ................................ R$ 5.800,00

  [Form inline quando clica +]
  Nome: [________]  Valor: [________]  Status: [Decretada v]  [Salvar]
```

### Detalhes tecnicos

- Interface `Despesa` atualizada para incluir `tipo_status: 'decretada' | 'em_teste'`
- Funcoes `handleAddDespesa(modalidade)` e `handleToggleStatus(id, statusAtual)` e `handleDeleteDespesa(id)`
- Formulario inline com campos nome, valor_real e select de tipo_status
- Categoria sera preenchida como "geral" por padrao para simplificar
- O `mes` sera formatado como `yyyy-MM-01` conforme padrao existente
