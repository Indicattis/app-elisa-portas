
# Adicionar tolerancia de 15cm na busca de precos da tabela

## Resumo

Atualmente, `buscarPrecosPorMedidas` sempre arredonda para cima: busca a menor largura >= informada e menor altura >= informada. A mudanca adiciona uma tolerancia de 15cm (0.15m) -- se a medida exceder o tamanho da tabela em ate 15cm, usa o tamanho inferior; a partir de 16cm, arredonda para cima como hoje.

**Exemplo:** tabela tem alturas 3.0 e 3.5
- Porta de 3.15m -> usa linha de 3.0 (excedeu apenas 15cm, dentro da tolerancia)
- Porta de 3.16m -> usa linha de 3.5 (excedeu 16cm, arredonda para cima)

## Mudanca

**Arquivo:** `src/utils/tabelaPrecosHelper.ts`

Alterar a logica da funcao `buscarPrecosPorMedidas`:

1. Buscar **todos** os itens ativos da tabela (sem filtro de gte), ordenados por largura e altura
2. Encontrar o item correto aplicando a tolerancia:
   - Para cada dimensao (largura e altura), verificar se a medida informada esta dentro de 0.15m acima de um tamanho da tabela
   - Se `medida - tamanho_tabela <= 0.15`, esse tamanho e aceito (arredonda para baixo)
   - Se `medida - tamanho_tabela > 0.15`, precisa do proximo tamanho (arredonda para cima)
3. Retornar o item que atende ambas as dimensoes com os menores valores

### Logica detalhada

```text
TOLERANCIA = 0.15

Para cada item da tabela (ordenado por largura, altura):
  - larguraOk = item.largura >= medidaLargura 
                OU (medidaLargura - item.largura <= TOLERANCIA)
  - alturaOk  = item.altura >= medidaAltura 
                OU (medidaAltura - item.altura <= TOLERANCIA)
  
  Se larguraOk E alturaOk -> retorna esse item (primeiro match)
```

Como a query ja ordena por largura e altura ascendente, o primeiro item que satisfaz ambas as condicoes e o correto.

## Detalhes tecnicos

A mudanca e centralizada em um unico arquivo (`tabelaPrecosHelper.ts`), afetando automaticamente todos os pontos que usam a funcao:
- `ProdutoVendaForm.tsx` (adicionar porta de enrolar/social)
- `PinturaRapidaModal.tsx` (buscar preco de pintura)

Alterar o filtro da query de:
```typescript
.gte('largura', largura)
.gte('altura', altura)
```
Para buscar todos e filtrar no frontend com tolerancia:
```typescript
// Sem filtros gte - busca tudo ordenado
// Depois filtra: item.largura >= largura - 0.15 AND item.altura >= altura - 0.15
// E seleciona o primeiro que satisfaz a condicao de tolerancia
```
