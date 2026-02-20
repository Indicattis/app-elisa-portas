

# Adicionar Tags de Fidelizado e Parceiro nos Clientes

## O que muda

Dois novos marcadores visuais nos clientes:
- Estrela preenchida = Cliente Fidelizado
- Triangulo preenchido = Parceiro

Esses marcadores aparecerao na coluna "Tag" da tabela em `/direcao/vendas/clientes` e poderao ser configurados na criacao e edicao de clientes.

## Alteracoes

### 1. Migracao de banco de dados

Adicionar duas colunas booleanas na tabela `clientes`:

```text
ALTER TABLE clientes ADD COLUMN fidelizado boolean DEFAULT false;
ALTER TABLE clientes ADD COLUMN parceiro boolean DEFAULT false;
```

### 2. Hook `src/hooks/useClientes.ts`

- Adicionar `fidelizado` e `parceiro` na interface `Cliente`
- Adicionar `fidelizado` e `parceiro` na interface `ClienteFormData`

### 3. Formulario `src/components/clientes/ClienteForm.tsx`

- Adicionar `fidelizado` e `parceiro` ao schema zod (booleanos opcionais)
- Adicionar dois checkboxes no formulario (ao lado do campo "Tipo de Cliente"), usando o componente Checkbox ja disponivel:
  - "Cliente Fidelizado" (com icone de estrela)
  - "Parceiro" (com icone de triangulo)

### 4. Pagina `src/pages/direcao/ClientesDirecao.tsx`

- Na coluna `tag` do `renderCell`, alem do badge CE/CR existente, renderizar:
  - Icone `Star` preenchido (fill="currentColor") em dourado quando `cliente.fidelizado === true`
  - Icone `Triangle` preenchido (fill="currentColor") em roxo quando `cliente.parceiro === true`
- Os icones aparecerao ao lado do badge de tipo existente

### 5. Pagina `src/pages/vendas/MeusClientes.tsx`

- Exibir os mesmos icones nos cards de clientes, para consistencia visual

## Secao tecnica

Arquivos modificados:
- `src/hooks/useClientes.ts` - tipos e form data
- `src/components/clientes/ClienteForm.tsx` - campos de formulario
- `src/pages/direcao/ClientesDirecao.tsx` - exibicao na tabela
- `src/pages/vendas/MeusClientes.tsx` - exibicao nos cards
- Nova migracao SQL para as colunas

