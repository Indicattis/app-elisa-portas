import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Package, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/collapsible";
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

const statusConfig: Record<string, { label: string; className: string }> = {
  concluida: { label: "Concluída", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  em_andamento: { label: "Em andamento", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  pausada: { label: "Pausada", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" }
};

interface Conferencia {
  id: string;
  conferido_por: string;
  status: string;
  iniciada_em: string;
  concluida_em: string | null;
  tempo_total_segundos: number;
  total_itens: number;
  itens_conferidos: number;
  observacoes: string | null;
  setor: string | null;
}

interface Usuario {
  user_id: string;
  nome: string;
  email: string;
  foto_perfil_url: string | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

interface ConferenciaRowProps {
  conferencia: Conferencia;
  usuario: Usuario | undefined;
  onRowClick: () => void;
}

function ConferenciaRow({ conferencia, usuario, onRowClick }: ConferenciaRowProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: itens = [], isLoading: loadingItens } = useQuery({
    queryKey: ["itens-conferencia-auditoria-fabrica", conferencia.id],
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
  const status = statusConfig[conferencia.status] || statusConfig.pausada;

  return (
    <>
      <TableRow 
        className="border-white/10 hover:bg-white/5 cursor-pointer"
        onClick={onRowClick}
      >
        <TableCell className="text-white/70">
          <div>
            <p className="font-medium text-white">
              {format(new Date(conferencia.iniciada_em), "dd/MM/yyyy", { locale: ptBR })}
            </p>
            <p className="text-xs text-white/50">
              {format(new Date(conferencia.iniciada_em), "HH:mm", { locale: ptBR })}
            </p>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={usuario?.foto_perfil_url || undefined} />
              <AvatarFallback className="bg-white/10 text-white text-xs">
                {usuario ? getInitials(usuario.nome || usuario.email) : "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-white text-sm">
              {usuario?.nome || usuario?.email || "Carregando..."}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <Badge className={cn("border", status.className)}>
            {status.label}
          </Badge>
        </TableCell>
        <TableCell className="text-white/70">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTempo(conferencia.tempo_total_segundos)}
          </div>
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </TableCell>
      </TableRow>
      
      {isOpen && (
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableCell colSpan={5} className="p-0">
            <Collapsible open={isOpen}>
              <CollapsibleContent>
                <div className="p-4 bg-white/5 border-t border-white/10">
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
                  ) : conferencia.status !== "concluida" ? (
                    <div className="text-center py-6 text-white/60">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                      <p className="text-white">Conferência em progresso</p>
                      <p className="text-sm">{conferencia.itens_conferidos} de {conferencia.total_itens} itens conferidos</p>
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
            </Collapsible>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function AuditoriaFabrica() {
  const navigate = useNavigate();
  const { data: conferencias = [], isLoading } = useQuery({
    queryKey: ["conferencias-todas-fabrica"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estoque_conferencias")
        .select("*")
        .or("setor.eq.fabrica,setor.is.null")
        .order("iniciada_em", { ascending: false });

      if (error) throw error;
      return data as Conferencia[];
    },
  });

  const { data: usuariosMap = {} } = useQuery({
    queryKey: ["usuarios-conferencias-fabrica", conferencias.map(c => c.conferido_por).join(",")],
    queryFn: async () => {
      const userIds = [...new Set(conferencias.map(c => c.conferido_por))];
      if (userIds.length === 0) return {};

      const { data } = await supabase
        .from("admin_users")
        .select("user_id, nome, email, foto_perfil_url")
        .in("user_id", userIds);

      return Object.fromEntries(
        (data || []).map(u => [u.user_id, u])
      ) as Record<string, Usuario>;
    },
    enabled: conferencias.length > 0,
  });

  const breadcrumbItems = [
    { label: 'Home', path: '/home' },
    { label: 'Direção', path: '/direcao' },
    { label: 'Estoque', path: '/direcao/estoque' },
    { label: 'Auditoria Fábrica' }
  ];

  return (
    <MinimalistLayout
      title="Auditoria Fábrica"
      subtitle="Histórico de conferências do estoque da fábrica"
      backPath="/direcao/estoque"
      breadcrumbItems={breadcrumbItems}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : conferencias.length === 0 ? (
        <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-3 text-white/30" />
            <p className="text-white/60">Nenhuma conferência encontrada</p>
          </div>
        </div>
      ) : (
        <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-white/70">Data</TableHead>
                <TableHead className="text-white/70">Responsável</TableHead>
                <TableHead className="text-white/70">Status</TableHead>
                <TableHead className="text-white/70">Tempo</TableHead>
                <TableHead className="text-white/70 w-16">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conferencias.map((conferencia) => (
                <ConferenciaRow 
                  key={conferencia.id} 
                  conferencia={conferencia} 
                  usuario={usuariosMap[conferencia.conferido_por]}
                  onRowClick={() => navigate('/direcao/estoque/configuracoes/produtos/fabrica')}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </MinimalistLayout>
  );
}
