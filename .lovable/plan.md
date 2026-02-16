
# Adicionar campos de Valor Total e Valor a Receber nos modais e sidebars da Expedicao

## Resumo
Adicionar dois campos monetarios (Valor Total e Valor a Receber) nos modais de criacao/edicao e nas sidebars de detalhes das Neo Instalacoes e Neo Correcoes em /logistica/expedicao. Os campos ja existem no banco de dados e nos tipos TypeScript -- so falta a UI.

## Mudancas

### 1. NeoInstalacaoModal.tsx (modal de criacao/edicao)
- Adicionar dois estados: `valorTotal` e `valorAReceber` (inicializados com 0)
- No useEffect de preenchimento ao editar, carregar `neoInstalacao.valor_total` e `neoInstalacao.valor_a_receber`
- Adicionar uma linha com dois inputs tipo number (lado a lado) antes do campo Descricao:
  - "Valor Total (R$)" 
  - "Valor a Receber (R$)"
- No `handleConfirm`, incluir `valor_total` e `valor_a_receber` no objeto `dados`

### 2. NeoCorrecaoModal.tsx (modal de criacao/edicao)
- Mesma logica do NeoInstalacaoModal: dois estados, preenchimento ao editar, dois inputs e inclusao no submit
- O NeoCorrecao ja tem `valor_total` e `valor_a_receber` no tipo `CriarNeoCorrecaoData`

### 3. NeoInstalacaoDetails.tsx (sidebar de detalhes)
- Adicionar secao de valores financeiros (entre Responsavel e Descricao) com icone DollarSign
- Exibir "Valor Total" e "Valor a Receber" formatados em moeda brasileira
- So exibir a secao se algum dos valores for maior que 0

### 4. NeoCorrecaoDetails.tsx (sidebar de detalhes)
- Mesma secao de valores financeiros, seguindo o layout ja existente com Separator

### Nao ha necessidade de migracao SQL -- as colunas ja existem no banco.

### Arquivos envolvidos
- `src/components/expedicao/NeoInstalacaoModal.tsx`
- `src/components/expedicao/NeoCorrecaoModal.tsx`
- `src/components/expedicao/NeoInstalacaoDetails.tsx`
- `src/components/expedicao/NeoCorrecaoDetails.tsx`
