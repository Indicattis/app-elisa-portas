
## Plano: Melhorar Downbars de Pedidos - Design Colorido e Informações Destacadas

### Objetivo
Redesenhar o componente `PedidoDetalhesSheet` (downbar) para:
1. Design mais colorido seguindo o tema minimalista (fundo escuro, gradientes azuis, glassmorphism)
2. Seções colapsáveis em "pasta" para Linhas do Pedido e Itens da Venda
3. Visualização do fluxo que o pedido percorrerá (usando `PedidoFluxogramaMap`)
4. Foto de perfil de quem concluiu cada ordem de produção
5. Destaque para Cliente e Valor da Venda no topo

---

### Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/pedidos/PedidoDetalhesSheet.tsx` | **Modificar** | Redesenho completo do componente |
| `src/hooks/usePedidosEtapas.ts` | **Modificar** | Buscar foto de quem concluiu ordens |
| `src/components/pedidos/PedidoFluxogramaMap.tsx` | **Modificar** | Adaptar para uso dentro do Sheet |

---

### Parte 1: Novo Layout do PedidoDetalhesSheet

**Estrutura Visual:**

```text
┌──────────────────────────────────────────────────────────────┐
│ HEADER (sticky, gradiente azul/roxo)                         │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 📋 Pedido #0XXX/XX                        [Ver Venda] →  │ │
│ └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ HERO SECTION (Cliente + Valor - DESTAQUE MÁXIMO)             │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 👤 NOME DO CLIENTE                           R$ XX.XXX   │ │
│ │    📍 Cidade - Estado    📞 Telefone                     │ │
│ └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ FLUXOGRAMA DO PEDIDO (visual colorido do caminho)            │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Aberto] → [Produção] → [Qualidade] → [Coleta] → [Fim]   │ │
│ └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ SEÇÕES COLAPSÁVEIS                                           │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 📁 Linhas do Pedido (12)                          [▼]    │ │
│ │    └─ Lista colapsável de linhas...                      │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 📁 Itens da Venda (3)                             [▼]    │ │
│ │    └─ Lista colapsável de produtos...                    │ │
│ └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ ORDENS DE PRODUÇÃO (com avatar de quem concluiu)             │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 🔧 Soldagem         ✓ Concluído   [Avatar] João          │ │
│ │ 🏭 Perfiladeira     ⏳ Em Andamento [Avatar] Maria        │ │
│ │ 📦 Separação        ○ Pendente                           │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

### Parte 2: Implementação do Design Minimalista

**Cores e Estilo (seguindo MinimalistLayout):**

```typescript
// Header com gradiente
className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border-b border-white/10"

// Cards de seção
className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl"

// Hero Section (cliente/valor)
className="bg-gradient-to-br from-blue-500/10 to-blue-900/20 border border-blue-500/20 rounded-xl p-4"

// Badges de status
const statusColors = {
  concluido: "bg-green-500/20 text-green-400 border-green-500/30",
  em_andamento: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  pendente: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
}
```

---

### Parte 3: Seções Colapsáveis com Collapsible

Usar componente `Collapsible` existente para criar seções expansíveis:

```tsx
<Collapsible open={linhasOpen} onOpenChange={setLinhasOpen}>
  <CollapsibleTrigger asChild>
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-2">
        <FolderOpen className="h-4 w-4 text-blue-400" />
        <span className="font-medium text-white">Linhas do Pedido</span>
        <Badge className="bg-blue-500/20 text-blue-400 text-xs">{linhas.length}</Badge>
      </div>
      <ChevronDown className={cn("h-4 w-4 text-white/60 transition-transform", linhasOpen && "rotate-180")} />
    </div>
  </CollapsibleTrigger>
  <CollapsibleContent className="mt-2 space-y-1">
    {/* Lista de linhas */}
  </CollapsibleContent>
</Collapsible>
```

---

### Parte 4: Integrar PedidoFluxogramaMap

Incorporar o componente de fluxograma diretamente no Sheet, adaptando para o tema escuro:

```tsx
// Dentro do PedidoDetalhesSheet
<div className="bg-white/5 rounded-xl border border-white/10 p-3">
  <h3 className="text-xs font-semibold text-white/60 uppercase mb-2 tracking-wider">
    Fluxo do Pedido
  </h3>
  <PedidoFluxogramaMap pedidoSelecionado={pedido} variant="inline" />
</div>
```

Modificar `PedidoFluxogramaMap` para aceitar uma prop `variant="inline"` que remove o Card wrapper e adapta para uso dentro de outros containers.

---

### Parte 5: Exibir Foto de Quem Concluiu

**5.1 Modificar usePedidosEtapas.ts**

Já existe a busca de `capturada_por_foto` e `capturada_por_nome` para o responsável. Esses mesmos dados serão usados como "quem está executando/concluiu" já que o responsável é quem captura e conclui a ordem.

Para ordens já concluídas, os dados do responsável permanecem, então podemos usar:
- `ordem.status === 'concluido'` → Exibir avatar como "Concluído por"
- `ordem.status === 'em_andamento'` → Exibir avatar como "Em execução por"

**5.2 Modificar PedidoDetalhesSheet.tsx**

Buscar dados das ordens com informações do responsável:

```tsx
// Atualizar fetchOrdens para incluir responsável
const { data: soldagem } = await supabase
  .from("ordens_soldagem")
  .select("id, numero_ordem, status, responsavel_id")
  .eq("pedido_id", pedido.id)
  .maybeSingle();

// Para cada ordem com responsavel_id, buscar info do usuário
if (soldagem?.responsavel_id) {
  const { data: user } = await supabase
    .from('admin_users')
    .select('foto_perfil_url, nome')
    .eq('user_id', soldagem.responsavel_id)
    .maybeSingle();
  
  ordensData.push({ 
    ...soldagem, 
    tipo: "Soldagem",
    responsavel_foto: user?.foto_perfil_url,
    responsavel_nome: user?.nome
  });
}
```

**5.3 Renderização com Avatar**

```tsx
{ordens.map((ordem) => (
  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
    <div className="flex items-center gap-3">
      {getStatusIcon(ordem.status)}
      <div>
        <p className="font-medium text-white text-sm">{ordem.tipo}</p>
        <p className="text-xs text-white/50">#{ordem.numero_ordem}</p>
      </div>
    </div>
    
    <div className="flex items-center gap-2">
      {ordem.responsavel_foto && (
        <Avatar className="h-7 w-7 border-2 border-white/20">
          <AvatarImage src={ordem.responsavel_foto} />
          <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
        </Avatar>
      )}
      <Badge className={getStatusColor(ordem.status)}>
        {getStatusLabel(ordem.status)}
      </Badge>
    </div>
  </div>
))}
```

---

### Parte 6: Hero Section - Cliente e Valor em Destaque

Mover informações do cliente e valor para o topo com visual destacado:

```tsx
{/* Hero Section - Cliente e Valor */}
<div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
  <div className="flex items-start justify-between">
    {/* Info Cliente */}
    <div className="flex-1">
      <h2 className="text-xl font-bold text-white mb-1">
        {venda.cliente_nome}
      </h2>
      <div className="flex items-center gap-4 text-sm text-white/60">
        {(venda.cidade || venda.estado) && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {[venda.cidade, venda.estado].filter(Boolean).join(' - ')}
          </span>
        )}
        {venda.cliente_telefone && (
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {venda.cliente_telefone}
          </span>
        )}
      </div>
    </div>
    
    {/* Valor da Venda */}
    <div className="text-right">
      <p className="text-xs text-white/50 uppercase tracking-wider">Valor Total</p>
      <p className="text-2xl font-bold text-green-400">
        {formatCurrency(venda.valor_venda || 0)}
      </p>
    </div>
  </div>
</div>
```

---

### Parte 7: Impacto em Outros Componentes

O `PedidoDetalhesSheet` é usado exclusivamente pelo `PedidoCard`, que é utilizado em:

1. `/direcao/gestao-fabrica` - GestaoFabricaDirecao.tsx
2. `/administrativo/pedidos` - PedidosAdminMinimalista.tsx
3. `/producao/dashboard` - PedidosEmProducaoReadOnly.tsx
4. `/vendas/acompanhar` - AcompanharPedido.tsx

Todas essas páginas se beneficiarão automaticamente da melhoria, mantendo consistência visual.

---

### Resumo das Modificações

| Arquivo | Modificações |
|---------|--------------|
| `PedidoDetalhesSheet.tsx` | Redesenho completo: tema escuro, hero section, collapsibles, fluxograma, avatares |
| `PedidoFluxogramaMap.tsx` | Adicionar prop `variant="inline"` para remover wrapper Card |
| Nenhuma migração SQL | Os dados de responsável já existem nas tabelas |

---

### Dependências Utilizadas

- `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` - Radix UI (já instalado)
- `Avatar`, `AvatarImage`, `AvatarFallback` - shadcn/ui (já instalado)
- `Badge`, `Button`, `Sheet` - shadcn/ui (já instalado)
- Ícones do `lucide-react` (já instalado)
