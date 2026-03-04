

# Mostrar valor projetado nas despesas listadas e remover formulário da Folha Salarial

## Alterações em `DREMesDirecao.tsx`

### 1. Exibir valor projetado nas despesas já adicionadas

Na listagem de cada despesa (linhas 149-174), mostrar ao lado do nome o valor projetado do mês correspondente àquela despesa. Para isso:

- Passar `tiposDisponiveis` para o mapeamento de despesas na renderização da lista
- Para cada despesa listada, buscar o tipo correspondente pelo nome (`tiposDisponiveis?.find(t => t.nome === d.nome)`)
- Se encontrado, exibir o `valor_maximo_mensal` como texto auxiliar (ex: "Projetado: R$ X.XXX,XX") abaixo do nome da despesa

### 2. Remover formulário de adição na Folha Salarial

- Adicionar uma nova prop opcional `hideAddButton?: boolean` ao `DespesaSection`
- Quando `hideAddButton` for `true`, esconder o botão "+" e impedir a abertura do formulário
- Passar `hideAddButton={true}` na instância de `DespesaSection` da "Folha Salarial" (linha 548)

## Arquivo afetado
- `src/pages/direcao/DREMesDirecao.tsx`

