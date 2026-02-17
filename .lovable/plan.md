
# Agrupar linhas por porta na sidebar OrdemLinhasSheet

## Resumo
Atualizar o componente `OrdemLinhasSheet` em `/fabrica/ordens-pedidos` para agrupar as linhas de producao por porta (usando `produto_venda_id` + `indice_porta`), seguindo o mesmo padrao visual usado nas downbars de producao (`OrdemDetalhesSheet`).

## O que muda para o usuario
- Em vez de uma lista "plana" de linhas, as linhas serao agrupadas em blocos visuais por porta
- Cada bloco tera um cabecalho mostrando "Porta #01", "Porta #02", etc., com dimensoes quando disponiveis
- Linhas sem porta associada aparecerao em um grupo "Itens gerais" no final
- O check de conclusao por linha e a impressao de etiqueta continuam funcionando normalmente dentro de cada grupo

## Alteracoes tecnicas

### `src/components/fabrica/OrdemLinhasSheet.tsx`
Na secao de renderizacao das linhas (linhas 620-694 do arquivo atual), substituir a lista plana por logica de agrupamento:

1. **Agrupar linhas** usando `produto_venda_id` + `indice_porta` como chave (mesmo algoritmo da downbar de producao):
   ```
   const linhasPorPorta = linhas.reduce((grupos, linha) => {
     const key = linha.produto_venda_id 
       ? `${linha.produto_venda_id}_${linha.indice_porta ?? 0}` 
       : 'sem_porta';
     grupos[key] = grupos[key] || [];
     grupos[key].push(linha);
     return grupos;
   }, {});
   ```

2. **Criar mapa de numeracao** para exibir "Porta #01", "#02", etc., na ordem de aparicao

3. **Renderizar cada grupo** com:
   - Cabecalho contendo icone, numeracao ("Porta #01") e dimensoes (largura x altura da primeira linha do grupo)
   - Badge de "concluido" quando todas as linhas do grupo estiverem marcadas
   - As linhas individuais com checkbox, nome, quantidade, tamanho, dimensoes e botao de etiqueta (mesmo layout atual)

4. **Grupo "Itens gerais"** para linhas sem `produto_venda_id` (chave `sem_porta`)

### Arquivos envolvidos
- `src/components/fabrica/OrdemLinhasSheet.tsx` (unico arquivo modificado)
