
# Plano: Adicionar Observações da Visita Técnica na Downbar de Controle

## Problema Identificado

A downbar (`PedidoDetalhesSheet.tsx`) usada na página `/producao/controle` não exibe as "Observações da Visita Técnica", que são informações importantes sobre especificações de cada porta (lado do motor, posição da guia, etc.).

Essa informação já é exibida em `OrdemDetalhesSheet.tsx` (usado nas páginas de produção por setor), mas está ausente na tela de controle.

## Solução

Adicionar a seção de "Especificações da Visita Técnica" em `PedidoDetalhesSheet.tsx`, buscando os dados da tabela `pedido_porta_observacoes`.

## Implementação Técnica

### Arquivo: `src/components/pedidos/PedidoDetalhesSheet.tsx`

**1. Importações a adicionar:**
```tsx
import { Wrench } from "lucide-react";  // Já existe outros imports de lucide
import {
  OPCOES_INTERNA_EXTERNA,
  OPCOES_LADO_MOTOR,
  OPCOES_POSICAO_GUIA,
  OPCOES_GUIA,
  OPCOES_APARENCIA_TESTEIRA,
} from "@/types/pedidoObservacoes";
import { Separator } from "@/components/ui/separator";
```

**2. Interface a adicionar:**
```tsx
interface ObservacaoVisita {
  id: string;
  produto_venda_id: string;
  indice_porta: number;
  interna_externa: string;
  lado_motor: string;
  posicao_guia: string;
  opcao_guia: string;
  aparencia_testeira: string;
}
```

**3. Estado e fetch a adicionar:**
```tsx
const [observacoesVisita, setObservacoesVisita] = useState<ObservacaoVisita[]>([]);
const [loadingObservacoes, setLoadingObservacoes] = useState(false);

// No useEffect existente (ou criar novo):
useEffect(() => {
  if (open && pedido?.id) {
    fetchObservacoesVisita();
  }
}, [open, pedido?.id]);

const fetchObservacoesVisita = async () => {
  setLoadingObservacoes(true);
  try {
    const { data } = await supabase
      .from('pedido_porta_observacoes')
      .select('*')
      .eq('pedido_id', pedido.id)
      .order('indice_porta', { ascending: true });
    
    setObservacoesVisita(data || []);
  } catch (error) {
    console.error("Erro ao buscar observações:", error);
  } finally {
    setLoadingObservacoes(false);
  }
};
```

**4. Seção visual a adicionar (após "Itens da Venda" e antes de "Ordens de Produção"):**
```tsx
{/* Observações da Visita Técnica */}
{observacoesVisita.length > 0 && (
  <Collapsible>
    <CollapsibleTrigger asChild>
      <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-colors">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-amber-400" />
          <span className="font-medium text-white text-sm">Especificações da Visita Técnica</span>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
            {observacoesVisita.length} {observacoesVisita.length === 1 ? 'porta' : 'portas'}
          </Badge>
        </div>
        <ChevronDown className="h-4 w-4 text-amber-400" />
      </div>
    </CollapsibleTrigger>
    <CollapsibleContent className="mt-2 space-y-2 pl-2">
      {observacoesVisita.map((obs, idx) => (
        <div key={obs.id || idx} className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
          <span className="text-xs font-medium text-amber-400 mb-2 block">
            Porta {obs.indice_porta + 1}
          </span>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs bg-amber-500/10 border-amber-500/30 text-amber-300">
              {OPCOES_INTERNA_EXTERNA[obs.interna_externa] || obs.interna_externa}
            </Badge>
            <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-300">
              Motor: {OPCOES_LADO_MOTOR[obs.lado_motor] || obs.lado_motor}
            </Badge>
            <Badge variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30 text-purple-300">
              {OPCOES_POSICAO_GUIA[obs.posicao_guia] || obs.posicao_guia}
            </Badge>
            <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-300">
              {OPCOES_GUIA[obs.opcao_guia] || obs.opcao_guia}
            </Badge>
            <Badge variant="outline" className="text-xs bg-orange-500/10 border-orange-500/30 text-orange-300">
              Testeira: {OPCOES_APARENCIA_TESTEIRA[obs.aparencia_testeira] || obs.aparencia_testeira}
            </Badge>
          </div>
        </div>
      ))}
    </CollapsibleContent>
  </Collapsible>
)}
```

## Resultado Esperado

| Local | Antes | Depois |
|-------|-------|--------|
| `/producao/controle` downbar | Sem observações técnicas | Seção colapsável com especificações por porta |

A seção será exibida apenas quando houver observações cadastradas para o pedido, mantendo a interface limpa quando não há dados.
