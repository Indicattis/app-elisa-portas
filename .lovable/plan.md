

# Implementar reestruturação de despesas em /direcao/dre/:mes

O banco de dados já está pronto (constraint atualizada, dados migrados). O problema é que o arquivo `DREMesDirecao.tsx` nunca foi modificado — ainda tem apenas 2 seções (Fixas e Variáveis lado a lado).

## Alterações em `src/pages/direcao/DREMesDirecao.tsx`

1. **Adicionar estados** para as 4 categorias + painel lateral:
   - `despesasFixas`, `despesasFolha`, `despesasProjetadas`, `despesasNaoEsperadas`
   - `tiposCustosVariaveis` (para o painel lateral)

2. **Atualizar `fetchDespesas`** para filtrar por 4 modalidades: `fixa`, `folha_salarial`, `projetada`, `variavel_nao_esperada`

3. **Adicionar query** para buscar `tipos_custos` onde `tipo = 'variavel'` e `ativo = true` para o painel lateral

4. **Atualizar `handleAddDespesa`** para aceitar as 4 modalidades

5. **Reestruturar o layout JSX**:
   - Grid de 2 colunas (3fr + 1fr)
   - Coluna esquerda: 4 seções empilhadas verticalmente (Fixas → Folha Salarial → Projetadas → Variáveis Não Esperadas)
   - Coluna direita: painel "Despesas Projetadas do Ano" (read-only, lista de tipos_custos variáveis com `valor_maximo_mensal × 12` e total no rodapé)

Nenhuma alteração de banco de dados necessária — tudo já está configurado.

