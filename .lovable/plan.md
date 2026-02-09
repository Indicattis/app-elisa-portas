
# Editar Medidas e Cores dos Produtos da Venda no Pedido

## Funcionalidade

Adicionar botoes de edicao inline na tabela "Produtos da Venda" da pagina `/administrativo/pedidos/:id` para:

1. **Alterar largura e altura** dos produtos tipo `porta_enrolar` e `porta_social`
2. **Alterar a cor** dos produtos tipo `pintura_epoxi`

## Comportamento

- Cada produto editavel tera um botao de editar (icone de lapis) ao lado dos campos editaveis
- Ao clicar, os campos se transformam em inputs inline (largura/altura ou select de cor)
- Um botao de salvar (check) e cancelar (X) aparece ao lado
- Ao salvar, atualiza diretamente na tabela `produtos_vendas` via Supabase e recarrega os dados do pedido
- Peso e Meia Canas sao recalculados automaticamente apos a edicao das medidas

## Detalhes tecnicos

### Arquivo: `src/pages/administrativo/PedidoViewMinimalista.tsx`

1. **Novos estados**:
   - `editandoProduto: string | null` -- ID do produto sendo editado
   - `editLargura: number` e `editAltura: number` -- valores temporarios para medidas
   - `editCorId: string` -- valor temporario para cor
   - `salvandoProduto: boolean` -- loading durante o save

2. **Buscar catalogo de cores** para o select:
   - Adicionar query `catalogo_cores` com `useQuery` para buscar todas as cores ativas (`ativa = true`)

3. **Funcao `handleSalvarProduto`**:
   - Para portas: atualiza `largura`, `altura` e `tamanho` (string formatada `LxA`) na tabela `produtos_vendas`
   - Para pintura: atualiza `cor_id` e `descricao` (nome da cor selecionada) na tabela `produtos_vendas`
   - Apos sucesso, chama `fetchPedidoDetails()` para recarregar dados

4. **Coluna "Tamanho" na tabela desktop** (linhas 565-578):
   - Se o produto esta em edicao e e porta: exibir dois inputs (largura e altura) com botoes salvar/cancelar
   - Senao: exibir valor atual como texto

5. **Coluna "Cor" na tabela desktop** (linhas 579):
   - Se o produto esta em edicao e e pintura: exibir select com cores do catalogo
   - Senao: exibir nome da cor atual

6. **Nova coluna "Acoes"** na tabela:
   - Botao de lapis para iniciar edicao (apenas para portas e pinturas)
   - Quando em edicao: botoes de salvar (check verde) e cancelar (X)

7. **Versao mobile** (linhas 596-610):
   - Mesma logica de edicao adaptada para o layout de cards

### Campos atualizados no banco

- **Portas** (`porta_enrolar`, `porta_social`): `largura`, `altura`, `tamanho` (string `LxA`)
- **Pintura** (`pintura_epoxi`): `cor_id`, `descricao` (nome da cor)

### Imports adicionais

- `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` de `@/components/ui/select`
- `Check` de `lucide-react`
- `Input` de `@/components/ui/input`
