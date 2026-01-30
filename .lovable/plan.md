
# Plano: Transformar /producao/controle para ser igual a /fabrica/pedidos-producao

## Resumo

Substituir completamente o conteúdo da página `/producao/controle` para replicar exatamente a estrutura e funcionalidade da página `/fabrica/pedidos-producao`, incluindo:
- Tabs de todas as etapas de produção
- Lista de pedidos com filtros e paginação
- Componente PortasPorEtapa (Desempenho por Etapa)
- Modal de atribuição de responsável por etapa

---

## Estrutura Atual vs Desejada

### Atual (`/producao/controle`)
```
- IndicadoresProducao
- PortasPorEtapa
- PedidosEmProducaoReadOnly
- DesempenhoSetoresProducao
- MateriaisNecessariosProducao
- MateriaisRanking
- CoresPintadasHoje
```

### Desejada (igual a `/fabrica/pedidos-producao`)
```
- MinimalistLayout (título: "Controle de Produção")
- PortasPorEtapa
- Tabs de Etapas (Aberto, Em Produção, Qualidade, Pintura, Coleta, Instalações, Correções, Finalizado)
- PedidosDraggableList com paginação
- Filtros (busca, tipo entrega, cor, prontos)
- Modal de responsável por etapa
```

---

## Alterações Necessárias

### Arquivo: `src/pages/ProducaoControle.tsx`

Substituir completamente o conteúdo para replicar a estrutura de `PedidosProducaoMinimalista.tsx`:

#### 1. Novos Imports
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, RefreshCw, Factory, Clock, ClipboardCheck, Paintbrush, Wrench, CheckCircle2, HardHat, AlertTriangle, UserPlus } from "lucide-react";
import { SelecionarResponsavelEtapaModal } from "@/components/pedidos/SelecionarResponsavelEtapaModal";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQueryClient } from "@tanstack/react-query";
import { usePedidosEtapas, usePedidosContadores } from "@/hooks/usePedidosEtapas";
import { useNeoInstalacoesListagem } from "@/hooks/useNeoInstalacoes";
import { useNeoCorrecoesListagem } from "@/hooks/useNeoCorrecoes";
import { useEtapaResponsaveis } from "@/hooks/useEtapaResponsaveis";
import { PedidosDraggableList } from "@/components/pedidos/PedidosDraggableList";
import { PedidosFiltrosMinimalista } from "@/components/pedidos/PedidosFiltrosMinimalista";
import { NeoInstalacaoCardGestao } from "@/components/pedidos/NeoInstalacaoCardGestao";
import { NeoCorrecaoCardGestao } from "@/components/pedidos/NeoCorrecaoCardGestao";
import { PortasPorEtapa } from "@/components/producao/dashboard/PortasPorEtapa";
import { ORDEM_ETAPAS, ETAPAS_CONFIG } from "@/types/pedidoEtapa";
import type { EtapaPedido } from "@/types/pedidoEtapa";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { MinimalistLayout } from "@/components/MinimalistLayout";
```

#### 2. Estado e Hooks
```typescript
const queryClient = useQueryClient();
const { toast } = useToast();
const [etapaAtiva, setEtapaAtiva] = useState<EtapaPedido>('aberto');
const [searchTerm, setSearchTerm] = useState('');
const viewMode = 'list';
const [tipoEntrega, setTipoEntrega] = useState('todos');
const [corPintura, setCorPintura] = useState('todas');
const [mostrarProntos, setMostrarProntos] = useState(false);
const [paginaAtual, setPaginaAtual] = useState(1);
const [modalResponsavelAberto, setModalResponsavelAberto] = useState(false);
const [etapaParaAtribuir, setEtapaParaAtribuir] = useState<EtapaPedido | null>(null);
const ITENS_POR_PAGINA = 25;
```

#### 3. Estrutura JSX Principal
- MinimalistLayout com título "Controle de Produção" e backPath="/producao"
- Breadcrumb: Home > Produção > Controle de Produção
- PortasPorEtapa no topo
- Tabs de etapas (mobile: Select, desktop: TabsList)
- CardContent com lista de pedidos e paginação
- Modal de responsável por etapa

---

## Funcionalidades Incluídas

| Funcionalidade | Descrição |
|----------------|-----------|
| **Tabs de Etapas** | 8 etapas: Aberto, Em Produção, Qualidade, Pintura, Coleta, Instalações, Correções, Finalizado |
| **Contadores** | Badge com quantidade de pedidos em cada etapa |
| **Filtros** | Busca por cliente/número, tipo de entrega, cor de pintura, mostrar apenas prontos |
| **Paginação** | 25 itens por página com navegação completa |
| **Responsável por Etapa** | Avatar do responsável na tab + modal para atribuir/remover |
| **Neo Instalações/Correções** | Exibe itens avulsos nas respectivas etapas |
| **Desempenho por Etapa** | Componente PortasPorEtapa com ranking de colaboradores |

---

## Diferenças em Relação à Página da Fábrica

| Aspecto | /fabrica/pedidos-producao | /producao/controle |
|---------|---------------------------|---------------------|
| Título | "Gestão de Pedidos" | "Controle de Produção" |
| BackPath | /fabrica | /producao |
| Breadcrumb | Home > Fábrica > Gestão | Home > Produção > Controle |
| Funcionalidade | Idêntica | Idêntica |

---

## Resultado Visual

### Desktop
```
┌─────────────────────────────────────────────────────────────┐
│ ← Controle de Produção                              [🔄]    │
│   Acompanhe o progresso dos pedidos                        │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Desempenho por Etapa (Hoje)        [Hoje ▼] [📅]        │ │
│ │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────────┐   │ │
│ │ │Perfil.│ │Soldad.│ │Separ. │ │Pintura│ │Carregam.  │   │ │
│ │ │ 45.5m │ │ 12    │ │ 8     │ │ 23m²  │ │ 5         │   │ │
│ │ │ Top 3 │ │ Top 3 │ │ Top 3 │ │ Top 3 │ │ Top 3     │   │ │
│ │ └───────┘ └───────┘ └───────┘ └───────┘ └───────────┘   │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [Aberto][Produção][Qualidade][Pintura][Coleta][Inst.][Corr.]│
├─────────────────────────────────────────────────────────────┤
│ Pedidos em Aberto     5 pedidos    [Filtros...]             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Pedido #1234 - Cliente X - 2 portas - Entrega 15/02    │ │
│ │ Pedido #1235 - Cliente Y - 1 porta  - Instalação 20/02 │ │
│ │ ...                                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                    [< 1 2 3 ... >]                          │
└─────────────────────────────────────────────────────────────┘
```

### Mobile
```
┌─────────────────────┐
│ ← Controle de Prod. │
├─────────────────────┤
│ Desempenho (Hoje)   │
│ [Perfiladas: 45.5m] │
│ [Soldadas: 12]      │
│ ...                 │
├─────────────────────┤
│ [Aberto ▼]          │
├─────────────────────┤
│ Pedidos em Aberto   │
│ ┌─────────────────┐ │
│ │ #1234 Cliente X │ │
│ └─────────────────┘ │
│ ...                 │
└─────────────────────┘
```

---

## Resumo de Alterações

| Arquivo | Ação |
|---------|------|
| `src/pages/ProducaoControle.tsx` | Substituir completamente |

---

## Observações Técnicas

1. A página usará os mesmos hooks da fábrica: `usePedidosEtapas`, `usePedidosContadores`, `useEtapaResponsaveis`
2. O componente `PedidosDraggableList` será usado com `enableDragAndDrop={false}` e `disableClienteClick={true}`
3. O componente `PortasPorEtapa` já inclui o ranking de desempenho por colaborador (Top 3)
4. A rota permanece protegida pela mesma key existente no `app_routes`
