import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, User, Package, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Conferência #{conferencia.id.substring(0, 8)}
                </CardTitle>
                <CardDescription className="flex items-center gap-4">
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
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {conferencia.concluida_em
                      ? format(new Date(conferencia.concluida_em), "dd/MM/yyyy", { locale: ptBR })
                      : "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {conferencia.concluida_em
                      ? format(new Date(conferencia.concluida_em), "HH:mm", { locale: ptBR })
                      : ""}
                  </p>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="border-t pt-4">
            {conferencia.observacoes && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Observações:</p>
                <p className="text-sm text-muted-foreground">{conferencia.observacoes}</p>
              </div>
            )}

            {loadingItens ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : itensComDiferenca.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p>Nenhuma diferença encontrada</p>
                <p className="text-sm">Todos os itens estavam de acordo com o sistema</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">
                    {itensComDiferenca.length} {itensComDiferenca.length === 1 ? "item com diferença" : "itens com diferença"}
                  </span>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">SKU</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="w-28 text-center">Anterior</TableHead>
                        <TableHead className="w-28 text-center">Conferido</TableHead>
                        <TableHead className="w-24 text-center">Diferença</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itensComDiferenca.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {item.sku || "-"}
                          </TableCell>
                          <TableCell className="font-medium">{item.nome_produto}</TableCell>
                          <TableCell className="text-center">{item.quantidade_anterior}</TableCell>
                          <TableCell className="text-center">{item.quantidade_conferida}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={item.diferenca > 0 ? "default" : "destructive"}
                              className={cn(
                                item.diferenca > 0 && "bg-green-600"
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
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function AuditoriaEstoque() {
  const navigate = useNavigate();
  const { conferenciasConcluidas, loadingConcluidas } = useConferenciaEstoque();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/estoque/conferencia")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Auditoria de Estoque</h1>
              <p className="text-sm text-muted-foreground">
                Histórico completo de conferências realizadas
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {loadingConcluidas ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : conferenciasConcluidas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhuma conferência concluída</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/estoque/conferencia")}
              >
                Iniciar Conferência
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {conferenciasConcluidas.map((conferencia) => (
              <ConferenciaCard key={conferencia.id} conferencia={conferencia} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
