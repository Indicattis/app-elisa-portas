import { useState } from "react";
import { Clock, User, Package, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useConferenciaEstoque, Conferencia } from "@/hooks/useConferenciaEstoque";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MinimalistLayout } from "@/components/MinimalistLayout";

function formatTempo(segundos: number): string {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  
  if (horas > 0) {
    return `${horas}h ${minutos}m ${segs}s`;
  }
  if (minutos > 0) {
    return `${minutos}m ${segs}s`;
  }
  return `${segs}s`;
}

interface ConferenciaCardProps {
  conferencia: Conferencia;
}

function ConferenciaCard({ conferencia }: ConferenciaCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Buscar usuário responsável
  const { data: usuario } = useQuery({
    queryKey: ["usuario", conferencia.conferido_por],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_users")
        .select("nome, email")
        .eq("user_id", conferencia.conferido_por)
        .single();
      return data;
    },
  });

  // Buscar itens da conferência
  const { data: itens = [], isLoading: loadingItens } = useQuery({
    queryKey: ["itens-conferencia-auditoria", conferencia.id],
    queryFn: async () => {
      const { data: itensData } = await supabase
        .from("estoque_conferencia_itens")
        .select(`
          id,
          produto_id,
          quantidade_anterior,
          quantidade_conferida
        `)
        .eq("conferencia_id", conferencia.id);

      if (!itensData) return [];

      // Buscar nomes dos produtos
      const produtoIds = itensData.map((i) => i.produto_id);
      const { data: produtos } = await supabase
        .from("estoque")
        .select("id, nome_produto, sku")
        .in("id", produtoIds);

      return itensData.map((item) => {
        const produto = produtos?.find((p) => p.id === item.produto_id);
        return {
          ...item,
          nome_produto: produto?.nome_produto || "Produto não encontrado",
          sku: produto?.sku,
          diferenca: (item.quantidade_conferida || 0) - item.quantidade_anterior,
        };
      });
    },
    enabled: isOpen,
  });

  const itensComDiferenca = itens.filter((i) => i.diferenca !== 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer hover:bg-white/5 transition-colors rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-base font-medium text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Conferência #{conferencia.id.substring(0, 8)}
                </div>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {usuario?.nome || usuario?.email || "Carregando..."}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTempo(conferencia.tempo_total_segundos)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {conferencia.total_itens} itens
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {conferencia.concluida_em
                      ? format(new Date(conferencia.concluida_em), "dd/MM/yyyy", { locale: ptBR })
                      : "-"}
                  </p>
                  <p className="text-xs text-white/50">
                    {conferencia.concluida_em
                      ? format(new Date(conferencia.concluida_em), "HH:mm", { locale: ptBR })
                      : ""}
                  </p>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-white/50" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-white/50" />
                )}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-white/10 pt-4 px-4 pb-4">
            {conferencia.observacoes && (
              <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-sm font-medium text-white mb-1">Observações:</p>
                <p className="text-sm text-white/60">{conferencia.observacoes}</p>
              </div>
            )}

            {loadingItens ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : itensComDiferenca.length === 0 ? (
              <div className="text-center py-6 text-white/60">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                <p className="text-white">Nenhuma diferença encontrada</p>
                <p className="text-sm">Todos os itens estavam de acordo com o sistema</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-medium text-white">
                    {itensComDiferenca.length} {itensComDiferenca.length === 1 ? "item com diferença" : "itens com diferença"}
                  </span>
                </div>
                <div className="border border-white/10 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-white/5">
                        <TableHead className="w-24 text-white/70">SKU</TableHead>
                        <TableHead className="text-white/70">Produto</TableHead>
                        <TableHead className="w-28 text-center text-white/70">Anterior</TableHead>
                        <TableHead className="w-28 text-center text-white/70">Conferido</TableHead>
                        <TableHead className="w-24 text-center text-white/70">Diferença</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itensComDiferenca.map((item) => (
                        <TableRow key={item.id} className="border-white/10 hover:bg-white/5">
                          <TableCell className="font-mono text-xs text-white/50">
                            {item.sku || "-"}
                          </TableCell>
                          <TableCell className="font-medium text-white">{item.nome_produto}</TableCell>
                          <TableCell className="text-center text-white/70">{item.quantidade_anterior}</TableCell>
                          <TableCell className="text-center text-white/70">{item.quantidade_conferida}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={item.diferenca > 0 ? "default" : "destructive"}
                              className={cn(
                                item.diferenca > 0 && "bg-emerald-600"
                              )}
                            >
                              {item.diferenca > 0 ? `+${item.diferenca}` : item.diferenca}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function AuditoriaEstoque() {
  const { conferenciasConcluidas, loadingConcluidas } = useConferenciaEstoque();

  const breadcrumbItems = [
    { label: 'Home', path: '/home' },
    { label: 'Estoque', path: '/estoque' },
    { label: 'Auditoria' }
  ];

  return (
    <MinimalistLayout
      title="Auditoria de Estoque"
      subtitle="Histórico completo de conferências realizadas"
      backPath="/estoque"
      breadcrumbItems={breadcrumbItems}
    >
      {loadingConcluidas ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : conferenciasConcluidas.length === 0 ? (
        <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-3 text-white/30" />
            <p className="text-white/60">Nenhuma conferência concluída</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {conferenciasConcluidas.map((conferencia) => (
            <ConferenciaCard key={conferencia.id} conferencia={conferencia} />
          ))}
        </div>
      )}
    </MinimalistLayout>
  );
}
