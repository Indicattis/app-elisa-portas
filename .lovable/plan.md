
## Plano: Adicionar Downbar com Historico nas Instalacoes

### Objetivo

1. Adicionar funcionalidade de clicar nas linhas de instalacao em `/logistica/instalacoes/ordens-instalacoes` para abrir uma downbar (Sheet) com detalhes do pedido
2. Adicionar o componente `PedidoHistoricoMovimentacoes` na downbar de ambas as paginas:
   - `/logistica/instalacoes/ordens-instalacoes` (nova downbar)
   - `/direcao/gestao-fabrica` (downbar existente via `PedidoDetalhesSheet`)

---

### Estrutura da Downbar para Instalacoes

A downbar de instalacoes reutilizara o mesmo componente `PedidoDetalhesSheet` ja existente, que inclui:
- Header com numero do pedido e botao "Ver Venda"
- Hero section com cliente e valor
- Fluxograma do pedido
- Linhas do pedido (colapsavel)
- Itens da venda (colapsavel)
- Ordens de producao com avatares
- **NOVO**: Historico de movimentacoes do pedido

---

### Arquivos a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/pedidos/PedidoDetalhesSheet.tsx` | Modificar | Adicionar secao de Historico de Movimentacoes |
| `src/components/instalacoes/OrdemInstalacaoRow.tsx` | Modificar | Adicionar onClick para abrir downbar |
| `src/pages/logistica/OrdensInstalacoesLogistica.tsx` | Modificar | Adicionar estado e componente PedidoDetalhesSheet |

---

### Mudanca 1: Adicionar Historico ao PedidoDetalhesSheet

Adicionar uma nova secao colapsavel no componente `PedidoDetalhesSheet` para exibir o historico de movimentacoes do pedido:

```typescript
// Importar o componente de historico
import { PedidoHistoricoMovimentacoes } from "./PedidoHistoricoMovimentacoes";

// Adicionar novo estado para a secao colapsavel
const [historicoOpen, setHistoricoOpen] = useState(false);

// Adicionar nova secao apos "Ordens de Producao"
<Collapsible open={historicoOpen} onOpenChange={setHistoricoOpen}>
  <CollapsibleTrigger asChild>
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-amber-400" />
        <span className="font-medium text-white text-sm">Historico de Movimentacoes</span>
      </div>
      <ChevronDown className={cn(
        "h-4 w-4 text-white/60 transition-transform duration-200",
        historicoOpen && "rotate-180"
      )} />
    </div>
  </CollapsibleTrigger>
  <CollapsibleContent className="mt-2 pl-2">
    <PedidoHistoricoMovimentacoes pedidoId={pedido.id} />
  </CollapsibleContent>
</Collapsible>
```

---

### Mudanca 2: Tornar OrdemInstalacaoRow Clicavel

Modificar o componente `OrdemInstalacaoRow` para aceitar um callback `onClick` que sera chamado ao clicar na linha:

```typescript
interface OrdemInstalacaoRowProps {
  ordem: OrdemInstalacao;
  onConcluir: (ordem: OrdemInstalacao) => void;
  isConcluindo: boolean;
  showCarregador?: boolean;
  onClick?: (ordem: OrdemInstalacao) => void; // NOVO
}

// No render, adicionar onClick na div principal
<div 
  className={cn(
    "h-[35px] grid items-center gap-2 px-3 rounded-md border bg-card/50 text-sm transition-colors hover:bg-muted/50",
    atrasado && "border-red-500/50 bg-red-500/5",
    onClick && "cursor-pointer" // NOVO
  )}
  onClick={() => onClick?.(ordem)} // NOVO
  style={{ gridTemplateColumns: "28px 70px 1fr 100px 80px 80px 50px" }}
>
```

---

### Mudanca 3: Adicionar Estado e Sheet na Pagina de Instalacoes

Na pagina `OrdensInstalacoesLogistica.tsx`:

1. Importar o componente `PedidoDetalhesSheet`
2. Adicionar estado para controlar qual pedido esta selecionado
3. Passar callback `onClick` para `OrdemInstalacaoRow`
4. Renderizar o `PedidoDetalhesSheet`

```typescript
// Imports
import { PedidoDetalhesSheet } from "@/components/pedidos/PedidoDetalhesSheet";

// Estado
const [selectedPedido, setSelectedPedido] = useState<any | null>(null);
const [showDetalhes, setShowDetalhes] = useState(false);

// Handler para abrir detalhes
const handleOpenDetalhes = (ordem: OrdemInstalacao) => {
  if (ordem.pedido) {
    // Construir objeto pedido compativel com PedidoDetalhesSheet
    const pedidoForSheet = {
      id: ordem.pedido.id,
      numero_pedido: ordem.pedido.numero_pedido,
      etapa_atual: ordem.pedido.etapa_atual,
      vendas: ordem.venda
    };
    setSelectedPedido(pedidoForSheet);
    setShowDetalhes(true);
  }
};

// Na renderizacao das linhas
<OrdemInstalacaoRow
  key={ordem.id}
  ordem={ordem}
  onConcluir={(o) => setConfirmDialog({ open: true, ordem: o })}
  isConcluindo={isConcluindo}
  showCarregador={true}
  onClick={handleOpenDetalhes}  // NOVO
/>

// Adicionar no final do componente
{selectedPedido && (
  <PedidoDetalhesSheet 
    pedido={selectedPedido} 
    open={showDetalhes} 
    onOpenChange={setShowDetalhes} 
  />
)}
```

---

### Dados Necessarios

O hook `useOrdensInstalacao` ja retorna dados suficientes:
- `ordem.pedido.id` - ID do pedido
- `ordem.pedido.numero_pedido` - Numero do pedido
- `ordem.pedido.etapa_atual` - Etapa atual
- `ordem.venda` - Dados da venda (cliente, produtos, valor, etc.)

O componente `PedidoDetalhesSheet` busca dados adicionais (linhas, ordens de producao) quando abre.

---

### Comportamento da Downbar

**Em ambas as paginas (`/direcao/gestao-fabrica` e `/logistica/instalacoes/ordens-instalacoes`):**

1. Ao clicar em um pedido/instalacao, abre Sheet pela parte inferior da tela
2. Header com numero do pedido e botao "Ver Venda"
3. Hero section com cliente e valor total
4. Fluxograma do pedido mostrando as etapas
5. Secoes colapsaveis:
   - Linhas do Pedido
   - Itens da Venda
6. Ordens de Producao com status e avatar do responsavel
7. **NOVO** Historico de Movimentacoes (timeline) mostrando:
   - Criacao do pedido
   - Avancos de etapa
   - Retornos (backlog)
   - Reorganizacoes de prioridade
   - Quem realizou cada acao
   - Data/hora de cada movimentacao

---

### Visual do Historico

O componente `PedidoHistoricoMovimentacoes` ja tem um design de timeline com:
- Icones coloridos por tipo (avanco = azul, backlog = vermelho, reorganizacao = cinza, criacao = verde)
- Badge indicando tipo da movimentacao
- Etapa origem -> Etapa destino
- Descricao/motivo (quando aplicavel)
- Nome do usuario que realizou a acao
- Data/hora formatada

---

### Resumo Visual

```text
+------------------------------------------+
|  [Sheet - Detalhes do Pedido]            |
|                                          |
|  +-- Hero (Cliente + Valor) -----------+ |
|  |  Nome Cliente         R$ 15.000     | |
|  +-------------------------------------+ |
|                                          |
|  +-- Fluxograma -----------------------+ |
|  | Aberto > Producao > Qualidade > ... | |
|  +-------------------------------------+ |
|                                          |
|  [v] Linhas do Pedido (3)                |
|  [>] Itens da Venda (2)                  |
|                                          |
|  +-- Ordens de Producao ---------------+ |
|  |  [Soldagem] #123    [Avatar] Pronto | |
|  |  [Perfil.] #124     [Avatar] Em And | |
|  +-------------------------------------+ |
|                                          |
|  [v] Historico de Movimentacoes   <-NOVO |
|      o Avanco: Aberto -> Em Producao     |
|      |   Por: Joao - 28/01 14:30         |
|      o Criacao                           |
|          Por: Maria - 27/01 09:15        |
|                                          |
+------------------------------------------+
```

---

### Detalhes Tecnicos

1. **Estilizacao do Historico na Downbar:**
   - O componente `PedidoHistoricoMovimentacoes` usa classes padrao do sistema
   - Pode precisar de ajustes de cor para ficar harmonico com o tema escuro da Sheet
   - Usar `text-white/60` e `text-white/40` para textos secundarios

2. **Performance:**
   - O historico e carregado via React Query com cache
   - Query key: `['pedido-movimentacoes', pedidoId]`
   - Dados carregados apenas quando a secao e expandida (graças ao `Collapsible`)

3. **Icone do Historico:**
   - Usar `History` do lucide-react
   - Cor: `text-amber-400` para destaque visual
