
# Seletor de porta/produto no modal de adicionar item

## O que sera feito

Adicionar um campo de selecao (Select) no `AdicionarLinhaModal` para que o usuario escolha a qual porta de enrolar ou produto o item sera agrupado. O campo sera opcional -- se nenhuma porta for selecionada, o item sera criado sem vinculo (gerando um grupo proprio pelo nome do item).

Se o pedido tiver portas, a porta 01 sera pre-selecionada por padrao.

## Mudancas

### 1. AdicionarLinhaModal.tsx - Receber lista de portas e adicionar seletor

**Novas props:**
- `portas`: array de portas expandidas (mesmo tipo usado no `PedidoLinhasEditor`)
- Tornar `portaId` e `indicePorta` opcionais (serao derivados da selecao)

**Estado interno:**
- `portaSelecionadaKey`: string que armazena a `_virtualKey` da porta selecionada, ou `'_none'` para "sem porta"
- Inicializado com a primeira porta (porta 01) quando existem portas, ou `'_none'` quando nao ha portas

**UI:**
- Adicionar um `Select` acima do campo de busca com label "Agrupar em"
- Opcoes: cada porta expandida com seu label (ex: "Porta de Enrolar #1 - 3.12m x 2.52m") + opcao "Nenhum (grupo proprio)"
- Quando a porta selecionada mudar, atualizar `portaLargura` e `portaAltura` usados nos calculos automaticos de tamanho e quantidade

**Logica de adicao:**
- Ao selecionar um produto, usar `produto_venda_id` e `indice_porta` da porta selecionada (ou `null`/`0` se "nenhum")
- Os calculos automaticos de tamanho e quantidade usarao as dimensoes da porta selecionada

### 2. PedidoLinhasEditor.tsx - Passar portas ao modal

**Mudanca na chamada do `AdicionarLinhaModal`:**
- Passar a prop `portas` com o array de portas expandidas
- Manter a pre-selecao: se aberto de dentro de uma pasta, a porta daquela pasta sera a pre-selecionada (via `portaId` inicial)
- Se aberto pelo botao global "Adicionar Produto", pre-selecionar porta 01

## Detalhes tecnicos

### Interface atualizada do AdicionarLinhaModal

```text
interface AdicionarLinhaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria?: CategoriaLinha;
  portaId?: string;          // agora opcional, usado como pre-selecao
  indicePorta?: number;      // agora opcional
  onAdicionar: (linha: PedidoLinhaNova) => Promise<any>;
  portas?: PortaExpandida[]; // nova prop - lista de portas disponiveis
  portaLargura?: number;     // mantido como fallback
  portaAltura?: number;      // mantido como fallback
}
```

### Select de porta no modal

```text
<Select value={portaSelecionadaKey} onValueChange={handlePortaChange}>
  <SelectTrigger>
    <SelectValue placeholder="Selecione..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="_none">Nenhum (grupo proprio)</SelectItem>
    {portas.map((porta, idx) => (
      <SelectItem key={porta._virtualKey} value={porta._virtualKey}>
        {getLabelProdutoExpandido(idx, porta.tipo_produto, ...)}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Logica de derivacao de dimensoes

Quando o usuario muda a porta selecionada, as dimensoes usadas nos calculos e previews serao atualizadas automaticamente:

```text
const portaAtual = portas.find(p => p._virtualKey === portaSelecionadaKey);
const larguraAtual = portaAtual?.largura ?? portaLargura;
const alturaAtual = portaAtual?.altura ?? portaAltura;
```

### Arquivos alterados

1. `src/components/pedidos/AdicionarLinhaModal.tsx` - Adicionar seletor de porta, derivar dimensoes, atualizar logica de adicao
2. `src/components/pedidos/PedidoLinhasEditor.tsx` - Passar `portas` como prop ao modal
