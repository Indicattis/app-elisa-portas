
# Adicionar botao Editar nos servicos avulsos pendentes

## Resumo
Adicionar um botao de edicao (icone de lapis) ao lado do botao "Agendar" na tabela de servicos avulsos pendentes em `/logistica/expedicao`, permitindo editar cada Neo diretamente da listagem.

## O que muda para o usuario
- Cada linha da tabela de servicos avulsos tera um botao com icone de lapis ao lado do botao "Agendar"
- Ao clicar, o usuario sera redirecionado para a pagina de edicao do Neo (`/logistica/expedicao/editar-neo/:id`)

## Alteracoes tecnicas

### 1. `src/components/expedicao/NeoServicosDisponiveis.tsx`
- Adicionar props `onEditarInstalacao` e `onEditarCorrecao` na interface
- Importar icone `Pencil` do lucide-react
- Na coluna "Acao" da tabela (linha 307-316), adicionar um botao com icone `Pencil` antes do botao "Agendar"
- O botao chamara a prop correspondente ao tipo do servico, passando o objeto original

### 2. `src/pages/logistica/ExpedicaoMinimalista.tsx`
- Passar as props `onEditarInstalacao={handleEditarNeoInstalacao}` e `onEditarCorrecao={handleEditarNeoCorrecao}` ao componente `NeoServicosDisponiveis` (ja existem os handlers na pagina)

### Arquivos envolvidos
- `src/components/expedicao/NeoServicosDisponiveis.tsx`
- `src/pages/logistica/ExpedicaoMinimalista.tsx`
