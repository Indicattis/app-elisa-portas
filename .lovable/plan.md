

# Plano: Adicionar informacoes da visita tecnica na downbar de Pintura

## Resumo

A downbar de pintura (`OrdemDetalhesSheet` com `tipoOrdem="pintura"`) ja exibe as informacoes de visita tecnica (`observacoesVisita`) quando elas estao presentes na ordem. Porem, o hook `useOrdemPintura` nao busca esses dados. O mesmo vale para a `ficha_visita_url` (foto/PDF da ficha de visita tecnica) que esta na tabela `pedidos_producao`.

A correcao envolve apenas atualizar o hook para buscar e incluir esses dados.

---

## Detalhes Tecnicos

### 1. Modificar `src/hooks/useOrdemPintura.ts`

Dentro do `queryFn`, para cada ordem, adicionar duas buscas:

**a) Buscar observacoes da visita tecnica** (tabela `pedido_porta_observacoes`):
```typescript
const { data: observacoesVisita } = await supabase
  .from('pedido_porta_observacoes')
  .select('*')
  .eq('pedido_id', ordem.pedido_id);
```

**b) Buscar ficha de visita tecnica** (campos `ficha_visita_url` e `ficha_visita_nome` da tabela `pedidos_producao` - ja buscada, apenas adicionar os campos no select):

Atualizar o select do `pedidos_producao` para incluir `ficha_visita_url, ficha_visita_nome`.

**c) Incluir no retorno** da ordem mapeada:
- `observacoesVisita` no objeto retornado
- `ficha_visita_url` e `ficha_visita_nome` no objeto `pedido`

### 2. Atualizar `OrdemDetalhesSheet.tsx` para exibir a ficha de visita

Adicionar a exibicao da ficha de visita tecnica (imagem ou PDF) na downbar, caso exista. Sera uma secao com link para visualizar o arquivo, similar ao `FichaVisitaUpload` mas em modo somente leitura:
- Se for imagem (png/jpg/webp): exibir preview clicavel
- Se for PDF: exibir link com icone de documento

Adicionar os campos `ficha_visita_url` e `ficha_visita_nome` na interface `Ordem` do componente.

A secao sera posicionada logo abaixo das especificacoes da visita tecnica (ou no mesmo local, caso nao haja observacoes).

### Arquivos modificados

1. **Modificar**: `src/hooks/useOrdemPintura.ts` - Buscar `pedido_porta_observacoes` e campos `ficha_visita_url/nome`
2. **Modificar**: `src/components/production/OrdemDetalhesSheet.tsx` - Adicionar interface fields e secao de ficha de visita

