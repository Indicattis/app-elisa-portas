
# Plano: Visualizar Linhas da Ordem ao Clicar na Downbar de Gestao de Fabrica

## Objetivo

Ao clicar em uma ordem de producao (Soldagem, Perfiladeira, Separacao, Qualidade, Pintura) na downbar do pedido em `/direcao/gestao-fabrica`, abrir um sheet lateral exibindo as linhas contidas naquela ordem.

---

## Situacao Atual

A `PedidoDetalhesSheet` exibe as ordens de producao como cartoes informativos:

```tsx
{ordens.map((ordem) => (
  <div key={ordem.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
    {/* Ícone + nome do tipo + número */}
    {/* Badge de status + Avatar do responsável */}
  </div>
))}
```

Esses cartoes nao sao clicaveis. O usuario nao consegue ver as linhas individuais da ordem.

---

## Solucao

Reutilizar o componente `OrdemLinhasSheet` ja existente (usado em `/fabrica/ordens-pedidos`) para exibir as linhas ao clicar em uma ordem na downbar.

### Fluxo de Interacao

```text
Usuario clica em um pedido
        |
        v
Downbar abre (PedidoDetalhesSheet)
        |
        v
Usuario ve "Ordens de Producao"
        |
        v
Clica em "Soldagem #OSO-2026-0001"
        |
        v
OrdemLinhasSheet abre (lateral)
mostrando linhas + checkboxes + progresso
```

---

## Alteracoes Tecnicas

### Arquivo: `src/components/pedidos/PedidoDetalhesSheet.tsx`

1. **Importar** o `OrdemLinhasSheet` e o tipo `OrdemStatus`

2. **Adicionar estado** para controlar qual ordem esta selecionada:

```tsx
const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemStatus | null>(null);
const [showOrdemLinhas, setShowOrdemLinhas] = useState(false);
```

3. **Converter** a interface `OrdemProducao` (local) para ser compativel com `OrdemStatus` (do hook `useOrdensPorPedido`)

4. **Tornar os cartoes de ordem clicaveis**:

```tsx
<button
  key={ordem.id}
  onClick={() => handleOrdemClick(ordem)}
  className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg 
             border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
>
  {/* Conteúdo existente */}
</button>
```

5. **Renderizar o OrdemLinhasSheet** ao final do componente:

```tsx
<OrdemLinhasSheet
  ordem={ordemSelecionada}
  open={showOrdemLinhas}
  onOpenChange={setShowOrdemLinhas}
/>
```

---

## Mapeamento de Dados

O `OrdemLinhasSheet` espera um objeto do tipo `OrdemStatus`:

```typescript
interface OrdemStatus {
  id: string | null;
  numero_ordem: string | null;
  status: string | null;
  tipo: TipoOrdem; // 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade' | 'pintura'
  responsavel: { nome: string; foto_url: string | null; iniciais: string } | null;
  pausada: boolean;
  justificativa_pausa: string | null;
  linha_problema: { id: string; item: string; quantidade: number; tamanho: string | null } | null;
}
```

A interface local `OrdemProducao` na `PedidoDetalhesSheet` precisa ser adaptada para incluir esses campos:

| Campo Atual | Novo Campo |
|-------------|------------|
| `tipo: string` (ex: "Soldagem") | `tipo: TipoOrdem` (ex: "soldagem") |
| - | `pausada: boolean` |
| - | `justificativa_pausa: string \| null` |
| - | `linha_problema: object \| null` |

---

## Busca Adicional de Dados

Atualmente o `fetchOrdens` busca apenas campos basicos. Sera necessario adicionar:
- `pausada`
- `justificativa_pausa`
- `pausada_em`
- `linha_problema_id` (com join para obter item/quantidade/tamanho)

---

## Resultado Visual

```text
ANTES:
┌─────────────────────────────────────────┐
│ Ordens de Producao (3)                  │
│ ┌─────────────────────────────────────┐ │
│ │ 🔧 Soldagem    #OSO-2026-001  ✅    │ │  <- Nao clicavel
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 🏭 Perfiladeira #OPE-2026-001 ⏳   │ │  <- Nao clicavel
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

DEPOIS:
┌─────────────────────────────────────────┐
│ Ordens de Producao (3)                  │
│ ┌─────────────────────────────────────┐ │
│ │ 🔧 Soldagem    #OSO-2026-001  ✅ >  │ │  <- Clicavel (hover com >)
│ └─────────────────────────────────────┘ │
│         |                                │
│         v                                │
│  ┌──────────────────────────┐           │
│  │ Sheet lateral abre com   │           │
│  │ linhas da ordem:         │           │
│  │ ☑ Porta enrolar 5x4m     │           │
│  │ ☐ Trilho superior        │           │
│  │ ☐ Mola balanceadora      │           │
│  └──────────────────────────┘           │
└─────────────────────────────────────────┘
```

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/pedidos/PedidoDetalhesSheet.tsx` | Adicionar estado para ordem selecionada, tornar cartoes clicaveis, integrar OrdemLinhasSheet |

---

## Impacto

- **Visibilidade**: Direcao pode ver detalhes granulares de cada ordem
- **Gerenciamento**: Permite visualizar progresso de linhas individuais
- **Consistencia**: Mesmo comportamento da pagina `/fabrica/ordens-pedidos`
- **Sem nova UI**: Reutiliza componente ja existente e testado
