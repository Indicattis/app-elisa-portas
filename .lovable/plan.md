

# Adicionar funcionalidade "Conferir" ao Almoxarifado

## Resumo
Adicionar a coluna `conferir_estoque` na tabela `almoxarifado` do banco de dados e implementar a mesma logica de toggle que existe na pagina de Fabrica, onde itens com conferencia desativada ocultam metricas de estoque.

## Etapas

### 1. Criar coluna no banco de dados
- Adicionar coluna `conferir_estoque` (boolean, default false) na tabela `almoxarifado` via migracao SQL

### 2. Atualizar o hook `useAlmoxarifado`
- Adicionar `conferir_estoque` a interface `AlmoxarifadoItem`
- Adicionar `conferir_estoque` a interface `AlmoxarifadoFormData`

### 3. Atualizar a pagina `ProdutosAlmoxarifado.tsx`

**Coluna "Conferir" na tabela:**
- Adicionar coluna "Conferir" no header (entre "Valor Total" e "Acoes")
- Adicionar Checkbox em cada linha com toggle direto no banco (mesmo padrao da Fabrica)
- Implementar funcao `handleToggleConferir` que faz update direto no Supabase

**Logica condicional nas colunas:**
- Quando `conferir_estoque` for `false`, exibir "---" nas colunas Est. Min, Est. Max, Atual, Preco/Un e Valor Total (igual Fabrica)
- Quando `conferir_estoque` for `true`, exibir os valores normalmente

**Indicadores e totais:**
- Calcular indicadores (Valor Estoque, Estoque Baixo, Em Excesso) apenas com itens onde `conferir_estoque === true`
- Footer de totais tambem considera apenas itens conferidos

**Modal de criacao/edicao:**
- Adicionar checkbox "Conferir estoque deste item" no formulario
- Incluir campo no estado `formData`, no `handleSubmit` e no reset

### 4. Atualizar colSpan
- Ajustar colSpan das celulas de loading/empty e footer para acomodar a nova coluna (de 8 para 9)

## Secao tecnica

### Migracao SQL
```sql
ALTER TABLE almoxarifado ADD COLUMN conferir_estoque boolean DEFAULT false;
```

### Arquivos alterados
- `src/hooks/useAlmoxarifado.ts` - interfaces
- `src/pages/direcao/estoque/ProdutosAlmoxarifado.tsx` - UI e logica

