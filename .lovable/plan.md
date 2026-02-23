

# Texto no Campo "Valor a Receber" para Neo Instalacoes e Correcoes

## Resumo

Permitir que o campo "Valor a Receber" nos cards de Neo Instalacoes e Neo Correcoes na gestao de fabrica aceite texto livre (igual ao que foi feito para pedidos), com Popover de edicao inline.

## 1. Migration - Nova coluna nas tabelas neo

```sql
ALTER TABLE public.neo_instalacoes ADD COLUMN valor_a_receber_texto TEXT DEFAULT NULL;
ALTER TABLE public.neo_correcoes ADD COLUMN valor_a_receber_texto TEXT DEFAULT NULL;
```

## 2. Atualizar tipos TypeScript

**Arquivos:** `src/types/neoInstalacao.ts` e `src/types/neoCorrecao.ts`

Adicionar `valor_a_receber_texto: string | null` em ambas as interfaces `NeoInstalacao` e `NeoCorrecao`.

## 3. Adicionar Popover de edicao no NeoInstalacaoCardGestao

**Arquivo:** `src/components/pedidos/NeoInstalacaoCardGestao.tsx`

- Adicionar prop `onUpdateValor?: (id: string, data: { valor_a_receber: number | null; valor_a_receber_texto: string }) => Promise<void>`
- Na coluna 7 (Valor a Receber), envolver o conteudo em um Popover com input de texto
- Logica de parse identica ao PedidoCard: tenta parsear como numero; se for numero salva em ambos os campos; se for texto salva so no texto e seta numerico como null
- Exibicao: priorizar `valor_a_receber_texto` quando existir

## 4. Adicionar Popover de edicao no NeoCorrecaoCardGestao

**Arquivo:** `src/components/pedidos/NeoCorrecaoCardGestao.tsx`

Mesma abordagem do item 3, com prop `onUpdateValor` e Popover inline.

## 5. Passar handler de update na GestaoFabricaDirecao

**Arquivo:** `src/pages/direcao/GestaoFabricaDirecao.tsx`

- Importar `supabase` para fazer update direto nos campos `valor_a_receber` e `valor_a_receber_texto` das tabelas `neo_instalacoes` e `neo_correcoes`
- Criar funcoes `handleUpdateValorNeoInstalacao` e `handleUpdateValorNeoCorrecao`
- Passar como prop `onUpdateValor` para os componentes `NeoInstalacaoCardGestao`, `NeoCorrecaoCardGestao`, e tambem para os `NeoInstalacoesDraggableList` / `NeoCorrecoesDraggableList`

## 6. Propagar prop nos DraggableLists

**Arquivo:** `src/components/pedidos/NeoDraggableList.tsx`

Adicionar prop `onUpdateValor` nas interfaces de `NeoInstalacoesDraggableList` e `NeoCorrecoesDraggableList` e repassar para os cards internos.

## Resultado esperado

- Clicar no valor a receber de uma Neo abre um Popover com input de texto
- Digitar numero: salva em ambos os campos (numerico + texto)
- Digitar texto: salva apenas no campo texto, numerico fica null
- Exibicao prioriza o texto quando disponivel
- Invalidar queries para atualizar a listagem apos salvar
