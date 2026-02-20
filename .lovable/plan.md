
# Redesign da Secao de Adicao de Linhas no PedidoLinhasEditor

## Problema Atual

O `PedidoLinhasEditor.tsx` (usado na pagina `/administrativo/pedidos/...`) tem varios problemas:

1. **Aviso persistente**: "Selecione uma porta para calcular o tamanho automaticamente" aparece mesmo quando a porta ja esta selecionada, porque o codigo compara `portas.find(p => p.id === ...)` mas as portas usam `_virtualKey` como identificador.
2. **Campos sempre visiveis**: Quantidade e tamanho aparecem inline na tabela mesmo quando nao estao em modo de edicao.
3. **Formulario de nova linha complexo**: O formulario inline na tabela e confuso e nao aproveita os modulos de calculo automatico de tamanho e quantidade.

## Solucao

Substituir o formulario inline de nova linha pelo `AdicionarLinhaModal` que ja existe e funciona corretamente com calculo automatico. Ajustar a tabela para mostrar quantidade e tamanho como texto (read-only) por padrao, com edicao apenas ao clicar.

## Alteracoes

### 1. PedidoLinhasEditor.tsx - Usar modal em vez de formulario inline

**Remover**:
- Estado `novaLinha`, `rascunhoLinha`, `buscaSku`, `popoverAberto`, `produtoSelectOpen`, `avisoCalculo`
- Funcoes `handleSalvarNovaLinha`, `handleCancelarNovaLinha`, `renderNovaLinhaForm`
- O formulario inline de nova linha (a `<tr>` com os selects e inputs)

**Adicionar**:
- Estado `modalAdicionarAberto` e `portaParaModal` (porta selecionada para o modal)
- Import e uso do `AdicionarLinhaModal` com as props corretas (portaId, portaLargura, portaAltura, indicePorta)
- Ao clicar "Adicionar" dentro de uma pasta aberta, abrir o modal passando os dados da porta
- Ao clicar "Adicionar Produto" global, abrir o modal (se so tem uma porta, seleciona automaticamente)

### 2. PedidoLinhasEditor.tsx - Campos quantidade/tamanho somente em modo edicao

**Tabela de linhas existentes** (`renderLinha`):
- Quantidade: mostrar como texto/badge por padrao (ex: "3x"), input somente quando `linhaEmEdicao === linha.id`
- Tamanho: mostrar como texto por padrao (ex: "2.50"), input somente quando `linhaEmEdicao === linha.id`
- Isso ja funciona parcialmente para `isReadOnly`, mas agora tambem se aplica quando `!isReadOnly` e a linha nao esta em modo de edicao

### 3. PedidoLinhasEditor.tsx - Design mais minimalista

- Remover coluna "Categoria" da tabela (ja esta implicita pela aba/contexto)
- Simplificar as acoes: manter apenas icone de editar (pencil) e remover (trash), remover duplicar do padrao
- Linhas da tabela mais compactas
- Remover os headers "Produto/Categoria/Qtd/Tamanho/Acoes" redundantes, usar um layout mais limpo

## Detalhes Tecnicos

### Modal de adicao

O `AdicionarLinhaModal` ja suporta:
- Busca de produtos por setor
- Calculo automatico de tamanho (`calcularTamanhoAutomatico`)
- Calculo automatico de quantidade (`calcularQuantidadeAutomatica` com suporte a `qtd_meia_cana`)
- Adicao direta ao clicar no produto (sem formulario intermediario)
- Toast de confirmacao
- Opcao manual como fallback

Para usar no PedidoLinhasEditor, precisamos determinar a `categoria` com base na pasta aberta ou permitir que o modal busque todos os produtos. Como o PedidoLinhasEditor nao separa por categoria (diferente do LinhasAgrupadasPorPorta), o modal sera aberto sem filtro de categoria ou com categoria 'separacao' como padrao, e a categoria sera determinada automaticamente pelo setor do produto selecionado.

**Alternativa mais simples**: Modificar `AdicionarLinhaModal` para aceitar categoria opcional. Quando nao fornecida, buscar todos os produtos ativos e determinar a categoria automaticamente ao adicionar.

### Edicao inline de quantidade/tamanho

Ao clicar no icone de editar, a linha entra em modo de edicao mostrando os inputs de quantidade, tamanho, porta e produto. Ao clicar em salvar/cancelar, volta ao modo texto.

## Arquivos modificados

1. `src/components/pedidos/PedidoLinhasEditor.tsx` - Refatoracao principal
2. `src/components/pedidos/AdicionarLinhaModal.tsx` - Tornar `categoria` opcional (buscar todos quando nao fornecida)
