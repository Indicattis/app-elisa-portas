import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, DoorOpen, Layers, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LinhaOrdem } from "@/hooks/useLinhasOrdem";
import type { UseMutationResult } from "@tanstack/react-query";

interface LinhasAgrupadasPorPortaSheetProps {
  linhas: LinhaOrdem[];
  marcarLinha: UseMutationResult<{ linhaId: string; concluida: boolean }, Error, { linhaId: string; concluida: boolean }, any>;
  handleImprimirEtiqueta: (linha: LinhaOrdem) => void;
}

interface GrupoPorta {
  key: string;
  label: string;
  dimensoes: string | null;
  linhas: LinhaOrdem[];
}

function agruparLinhasPorPorta(linhas: LinhaOrdem[]): GrupoPorta[] {
  const gruposMap: Record<string, LinhaOrdem[]> = {};
  const ordemKeys: string[] = [];

  for (const linha of linhas) {
    const key = linha.produto_venda_id
      ? `${linha.produto_venda_id}_${linha.indice_porta ?? 0}`
      : 'sem_porta';
    if (!gruposMap[key]) {
      gruposMap[key] = [];
      ordemKeys.push(key);
    }
    gruposMap[key].push(linha);
  }

  let portaNum = 0;
  return ordemKeys.map((key) => {
    const linhasGrupo = gruposMap[key];
    if (key === 'sem_porta') {
      return {
        key,
        label: 'Itens gerais',
        dimensoes: null,
        linhas: linhasGrupo,
      };
    }
    portaNum++;
    const primeira = linhasGrupo[0];
    const dims = primeira.largura && primeira.altura
      ? `${Number(primeira.largura).toFixed(2)}m × ${Number(primeira.altura).toFixed(2)}m`
      : null;
    return {
      key,
      label: `Porta #${String(portaNum).padStart(2, '0')}`,
      dimensoes: dims,
      linhas: linhasGrupo,
    };
  });
}

function LinhaRow({
  linha,
  marcarLinha,
  handleImprimirEtiqueta,
}: {
  linha: LinhaOrdem;
  marcarLinha: LinhasAgrupadasPorPortaSheetProps['marcarLinha'];
  handleImprimirEtiqueta: (linha: LinhaOrdem) => void;
}) {
  return (
    <div
      className={cn(
        "grid gap-2 px-2 py-2 rounded-md transition-all duration-200 border",
        linha.concluida
          ? "bg-green-500/10 border-green-500/30"
          : "bg-zinc-800/30 border-zinc-700/30 hover:bg-zinc-800/50"
      )}
      style={{ gridTemplateColumns: '24px 1fr 45px 55px 85px 36px', alignItems: 'center' }}
    >
      <div className="flex items-center justify-center h-full">
        <Checkbox
          checked={linha.concluida}
          onCheckedChange={(checked) => {
            marcarLinha.mutate({ linhaId: linha.id, concluida: checked as boolean });
          }}
          className="border-zinc-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
        />
      </div>
      <div className="flex items-center h-full">
        <span className={cn(
          "text-sm truncate",
          linha.concluida ? "text-green-300 line-through" : "text-white"
        )}>
          {linha.estoque?.nome_produto || linha.item}
        </span>
      </div>
      <div className="flex items-center justify-center h-full">
        <span className="text-xs text-zinc-400">{linha.quantidade}</span>
      </div>
      <div className="flex items-center justify-center h-full">
        <span className="text-xs text-zinc-400">{linha.tamanho || '-'}</span>
      </div>
      <div className="flex items-center justify-center h-full">
        <span className="text-xs text-zinc-400">
          {linha.largura && linha.altura
            ? `${linha.largura}x${linha.altura}`
            : '-'}
        </span>
      </div>
      <div className="flex items-center justify-center h-full">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-zinc-700/50"
          onClick={() => handleImprimirEtiqueta(linha)}
          title="Imprimir etiqueta"
        >
          <Printer className="h-4 w-4 text-zinc-400 hover:text-white" />
        </Button>
      </div>
    </div>
  );
}

export function LinhasAgrupadasPorPortaSheet({
  linhas,
  marcarLinha,
  handleImprimirEtiqueta,
}: LinhasAgrupadasPorPortaSheetProps) {
  const grupos = agruparLinhasPorPorta(linhas);

  // If only one group "sem_porta", render flat
  if (grupos.length === 1 && grupos[0].key === 'sem_porta') {
    return (
      <div className="space-y-1">
        <GridHeader />
        {grupos[0].linhas.map((linha) => (
          <LinhaRow key={linha.id} linha={linha} marcarLinha={marcarLinha} handleImprimirEtiqueta={handleImprimirEtiqueta} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {grupos.map((grupo) => {
        const concluidas = grupo.linhas.filter(l => l.concluida).length;
        const total = grupo.linhas.length;
        const todasConcluidas = total > 0 && concluidas === total;
        const isPorta = grupo.key !== 'sem_porta';

        return (
          <Collapsible key={grupo.key} defaultOpen>
            <div className={cn(
              "rounded-lg border",
              todasConcluidas ? "border-green-500/30 bg-green-500/5" : "border-zinc-700/50"
            )}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/30 rounded-t-lg transition-colors">
                  <ChevronDown className="h-4 w-4 text-zinc-500 transition-transform duration-200 [[data-state=closed]_&]:rotate-[-90deg]" />
                  {isPorta ? (
                    <DoorOpen className="h-4 w-4 text-blue-400" />
                  ) : (
                    <Layers className="h-4 w-4 text-zinc-400" />
                  )}
                  <span className="text-sm font-medium text-white">{grupo.label}</span>
                  {grupo.dimensoes && (
                    <span className="text-xs text-zinc-400">{grupo.dimensoes}</span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{concluidas}/{total}</span>
                    {todasConcluidas && (
                      <Badge variant="outline" className="text-[10px] h-5 border-green-500/50 text-green-400 bg-green-500/10">
                        Concluído
                      </Badge>
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-2 pb-2 space-y-1">
                  <GridHeader />
                  {grupo.linhas.map((linha) => (
                    <LinhaRow key={linha.id} linha={linha} marcarLinha={marcarLinha} handleImprimirEtiqueta={handleImprimirEtiqueta} />
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}

function GridHeader() {
  return (
    <div
      className="grid gap-2 px-2 py-1.5 text-[10px] text-zinc-500 uppercase tracking-wide border-b border-zinc-700/50"
      style={{ gridTemplateColumns: '24px 1fr 45px 55px 85px 36px' }}
    >
      <span></span>
      <span>Item</span>
      <span className="text-center">Qtd</span>
      <span className="text-center">Tam</span>
      <span className="text-center">Dims</span>
      <span></span>
    </div>
  );
}
