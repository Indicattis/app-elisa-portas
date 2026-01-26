
## Plano: Melhorar Design da Pagina /fabrica/ordens-pedidos

### Visao Geral

Aprimorar a pagina de Ordens por Pedido com:
1. Cards de pedido compactos (30px de altura) com informacoes adicionais
2. Dados de cor, localizacao, portas P/G, metragem linear e quadrada
3. Icone de instalacao/entrega e foto do vendedor
4. Foto do responsavel nas ordens expandidas
5. Abas replicadas de /direcao/gestao-fabrica (todas as etapas)

---

### Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `src/hooks/useOrdensPorPedido.ts` | Expandir busca para incluir produtos, vendedor, responsaveis |
| `src/components/fabrica/PedidoOrdemCard.tsx` | Redesign com altura compacta e badges informativos |
| `src/pages/fabrica/OrdensPorPedido.tsx` | Atualizar tabs para todas as etapas |
| `src/components/fabrica/OrdemLinhasSheet.tsx` | Adicionar foto do responsavel |

---

### Parte 1: Atualizar Hook useOrdensPorPedido

Expandir a interface `PedidoComOrdens` para incluir todos os dados necessarios:

```typescript
interface PedidoComOrdens {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  etapa_atual: string;
  prioridade_etapa: number | null;
  
  // NOVOS CAMPOS
  localizacao: string | null;           // cidade/estado
  tipo_entrega: 'instalacao' | 'entrega' | null;
  cores: { nome: string; codigo_hex: string }[];
  portas_p: number;                     // quantidade portas pequenas
  portas_g: number;                     // quantidade portas grandes
  metragem_linear: number;              // total meia canas em metros
  metragem_quadrada: number;            // total m2 para pintura
  vendedor: {
    nome: string;
    foto_url: string | null;
    iniciais: string;
  } | null;
  
  ordens: {
    soldagem: OrdemStatusExtended;
    perfiladeira: OrdemStatusExtended;
    separacao: OrdemStatusExtended;
    qualidade: OrdemStatusExtended;
    pintura: OrdemStatusExtended;
  };
}

interface OrdemStatusExtended extends OrdemStatus {
  responsavel: {
    nome: string;
    foto_url: string | null;
    iniciais: string;
  } | null;
}
```

**Consultas adicionais necessarias:**

1. Buscar `vendas.atendente_id` com join em `admin_users` para foto do vendedor
2. Buscar `produtos_vendas` via `venda_id` para calcular P/G e m2
3. Buscar `linhas_ordens` tipo `perfiladeira` para metragem linear
4. Buscar `cidade/estado` de vendas ou clientes
5. Buscar `responsavel_id` de cada ordem com join em `admin_users`

---

### Parte 2: Redesign do PedidoOrdemCard

Layout compacto com altura fixa de 30px quando fechado:

```text
+------------------------------------------------------------------+
| [>] #0134 | [cor] Preto | Caxias/RS | P:2 G:1 | 45.2m | 37.6m2 | [truck] [avatar] |
+------------------------------------------------------------------+
```

**Elementos visuais:**

- **Chevron**: Indicador de expansao (4px)
- **Numero do pedido**: Texto branco, fonte medium
- **Cor**: Badge com quadrado colorido + nome da cor
- **Localizacao**: Cidade/UF em texto zinc
- **P/G**: Badges "P:2" e "G:1" para portas pequenas/grandes
- **Metragem linear**: "45.2m" com icone de regua
- **Metragem quadrada**: "37.6m2" com icone de pintura
- **Tipo entrega**: Icone Truck (entrega) ou Wrench (instalacao)
- **Avatar vendedor**: Foto circular 20x20 com fallback de iniciais

**Implementacao de estilos:**

```typescript
// Card fechado - altura compacta
<button className="w-full h-[30px] px-2 flex items-center gap-2 
                   bg-zinc-900/50 border border-zinc-800/50 
                   hover:bg-zinc-800/50 transition-all">
  
  {/* Chevron */}
  <ChevronRight className="w-3 h-3 text-zinc-500 flex-shrink-0" />
  
  {/* Numero pedido */}
  <span className="text-xs font-medium text-white">#{numero}</span>
  
  {/* Separador */}
  <div className="w-px h-4 bg-zinc-700/50" />
  
  {/* Cor */}
  <div className="flex items-center gap-1">
    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: hex }} />
    <span className="text-[10px] text-zinc-400">{corNome}</span>
  </div>
  
  {/* Localizacao */}
  <span className="text-[10px] text-zinc-500">{cidade}/{uf}</span>
  
  {/* Portas P/G */}
  <div className="flex gap-1">
    <span className="text-[10px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400">P:{p}</span>
    <span className="text-[10px] px-1 py-0.5 rounded bg-orange-500/20 text-orange-400">G:{g}</span>
  </div>
  
  {/* Metragens */}
  <span className="text-[10px] text-zinc-400">{linear.toFixed(1)}m</span>
  <span className="text-[10px] text-zinc-400">{quadrada.toFixed(1)}m2</span>
  
  {/* Icone entrega/instalacao */}
  {tipoEntrega === 'instalacao' ? (
    <Wrench className="w-3 h-3 text-cyan-400" />
  ) : (
    <Truck className="w-3 h-3 text-indigo-400" />
  )}
  
  {/* Avatar vendedor */}
  <Avatar className="h-5 w-5 border border-zinc-700">
    <AvatarImage src={vendedorFoto} />
    <AvatarFallback className="text-[8px] bg-zinc-800">{iniciais}</AvatarFallback>
  </Avatar>
</button>
```

---

### Parte 3: Expandir Ordens com Avatar do Responsavel

Quando expandido, cada badge de ordem mostra a foto do responsavel atual:

```text
+----------------------------------------------------------------+
| [Soldagem] Em andamento  [avatar Elton]                        |
| [Perfiladeira] Concluido [avatar Maria]                        |
| [Separacao] Pendente     [avatar -]                            |
+----------------------------------------------------------------+
```

**Implementacao:**

```typescript
<button className="px-3 py-2 rounded-lg border flex items-center justify-between">
  <div className="flex flex-col items-start gap-0.5">
    <span className="font-medium">{ORDEM_LABELS[tipo]}</span>
    <span className="text-xs opacity-80">{statusLabel}</span>
  </div>
  
  {ordem.responsavel && (
    <Avatar className="h-6 w-6 border border-primary/30">
      <AvatarImage src={ordem.responsavel.foto_url} />
      <AvatarFallback className="text-[10px] bg-primary/20">
        {ordem.responsavel.iniciais}
      </AvatarFallback>
    </Avatar>
  )}
</button>
```

---

### Parte 4: Atualizar Abas para Todas as Etapas

Replicar as abas de /direcao/gestao-fabrica usando `ORDEM_ETAPAS`:

```typescript
import { ORDEM_ETAPAS, ETAPAS_CONFIG, EtapaPedido } from "@/types/pedidoEtapa";

// Substituir o array ETAPAS atual por:
const ETAPAS_VISIVEIS = ORDEM_ETAPAS.filter(e => e !== 'finalizado');

// No componente:
<TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
  {ETAPAS_VISIVEIS.map((etapa) => {
    const config = ETAPAS_CONFIG[etapa];
    return (
      <TabsTrigger key={etapa} value={etapa}>
        {config.label}
      </TabsTrigger>
    );
  })}
</TabsList>
```

**Etapas a exibir:**
- Pedidos em Aberto
- Em Producao
- Inspecao de Qualidade
- Aguardando Pintura
- Expedicao Coleta
- Expedicao Instalacao
- Instalacoes
- Correcoes

---

### Parte 5: Logica de Calculo das Metragens

**Portas P/G (baseado na area):**

```typescript
const calcularPortas = (produtos: any[]) => {
  const portas = produtos.filter(p => p.tipo_produto === 'porta_enrolar');
  let p = 0, g = 0;
  
  portas.forEach(porta => {
    const area = (porta.largura || 0) * (porta.altura || 0);
    const qtd = porta.quantidade || 1;
    if (area > 25) g += qtd;
    else p += qtd;
  });
  
  return { p, g };
};
```

**Metragem Linear (meia canas da perfiladeira):**

```typescript
const calcularMetragemLinear = (linhas: any[]) => {
  return linhas
    .filter(l => l.tipo_ordem === 'perfiladeira')
    .reduce((total, l) => {
      const metros = parseFloat((l.tamanho || '0').replace(',', '.')) || 0;
      return total + (metros * (l.quantidade || 1));
    }, 0);
};
```

**Metragem Quadrada (para pintura):**

```typescript
const calcularMetragemQuadrada = (produtos: any[]) => {
  return produtos
    .filter(p => p.tipo_produto === 'porta_enrolar')
    .reduce((total, p) => {
      const area = (p.largura || 0) * (p.altura || 0);
      return total + (area * (p.quantidade || 1));
    }, 0);
};
```

---

### Resumo das Mudancas

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `useOrdensPorPedido.ts` | Modificar | Expandir query para produtos, vendedor, responsaveis, metragens |
| `PedidoOrdemCard.tsx` | Modificar | Redesign compacto 30px com badges e avatares |
| `OrdensPorPedido.tsx` | Modificar | Usar ORDEM_ETAPAS para todas as abas |
| `OrdemLinhasSheet.tsx` | Modificar | Exibir avatar do responsavel no header |

---

### Fluxo de Dados Atualizado

```text
pedidos_producao
  |-- venda_id --> vendas
  |                  |-- atendente_id --> admin_users (vendedor)
  |                  |-- cidade, estado, tipo_entrega
  |                  |-- produtos_vendas (cores, portas P/G, m2)
  |
  |-- id --> linhas_ordens (metragem linear perfiladeira)
  |
  |-- id --> ordens_* (5 tabelas)
               |-- responsavel_id --> admin_users (responsavel)
```

---

### Resultado Esperado

1. Cards de pedido com altura compacta (30px) exibindo todas as informacoes
2. Badge colorido mostrando a cor principal do pedido
3. Localizacao (cidade/UF) visivel
4. Contadores P/G para portas pequenas e grandes
5. Metragem linear (meia canas) e quadrada (pintura) calculadas
6. Icone diferenciando instalacao vs entrega
7. Avatar do vendedor no card
8. Avatar do responsavel em cada ordem expandida
9. Todas as etapas de producao nas abas (igual /direcao/gestao-fabrica)
