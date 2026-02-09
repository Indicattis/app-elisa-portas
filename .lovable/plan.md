
# Adicionar Produtos da Venda e Ficha de Visita Tecnica na pagina de Direção

## Problema

A pagina `/direcao/pedidos/:id` (`PedidoViewDirecao.tsx`) nao exibe os **produtos da venda** nem a **ficha de visita tecnica**, diferente da pagina administrativa (`PedidoViewMinimalista.tsx`) que possui ambas as secoes.

## O que sera adicionado

### 1. Produtos da Venda
- Buscar os dados de `produtos_vendas` associados a venda do pedido (incluindo cor via `catalogo_cores`)
- Exibir uma tabela com: Tipo, Descricao, Tamanho, Cor, Fabricacao (interno/terceirizado), Peso, Meia Canas e Quantidade
- Versao mobile com cards compactos
- Logica de calculo de peso e meia canas igual a pagina administrativa

### 2. Ficha de Visita Tecnica
- Exibir a ficha ja existente em `pedido.ficha_visita_url` usando o componente `FichaVisitaUpload` em modo somente leitura (disabled)
- Posicionada entre as informacoes do cliente e os itens do pedido

## Detalhes tecnicos

### Arquivo: `src/pages/direcao/PedidoViewDirecao.tsx`

1. **Importar** `FichaVisitaUpload`, `ClipboardList` icon, e `Badge` (ja importado)

2. **Atualizar interface Pedido** para incluir:
   - `ficha_visita_nome?: string | null`
   - `produtos_venda?: any[]`

3. **Atualizar `fetchPedidoDetails`**:
   - Apos buscar os dados da venda, buscar tambem `produtos_vendas` com join em `catalogo_cores` para a cor
   - Adicionar `ficha_visita_nome` ao estado do pedido

4. **Adicionar funcoes utilitarias** `calcularPeso` e `calcularMeiaCanas` (copiadas do PedidoViewMinimalista)

5. **Adicionar secao "Ficha de Visita Tecnica"** apos o grid de informacoes do cliente:
   - Usar `FichaVisitaUpload` com `disabled={true}` (somente visualizacao na direcao)
   - Exibir somente se houver `ficha_visita_url`

6. **Adicionar secao "Produtos da Venda"** antes dos itens do pedido:
   - Tabela desktop com colunas: Tipo, Descricao, Tamanho, Cor, Fabricacao, Peso, Meia Canas, Qtd
   - Cards mobile com as mesmas informacoes
   - Exibir somente se houver produtos

### Arquivo editado

1. **Editar**: `src/pages/direcao/PedidoViewDirecao.tsx`
