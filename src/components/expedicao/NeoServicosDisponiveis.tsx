import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Calendar, Wrench, Hammer, MapPin, Users, Loader2 } from "lucide-react";
import { NeoInstalacao } from "@/types/neoInstalacao";
import { NeoCorrecao } from "@/types/neoCorrecao";
import { toast } from "sonner";

interface NeoServicosDisponiveisProps {
  neoInstalacoes: NeoInstalacao[];
  neoCorrecoes: NeoCorrecao[];
  onAgendarInstalacao: (id: string, data: string) => Promise<void>;
  onAgendarCorrecao: (id: string, data: string) => Promise<void>;
  isLoadingInstalacoes?: boolean;
  isLoadingCorrecoes?: boolean;
}

type ServicoItem = {
  id: string;
  tipo: 'instalacao' | 'correcao';
  nome_cliente: string;
  cidade: string;
  estado: string;
  equipe_nome: string | null;
  autorizado_nome: string | null;
  tipo_responsavel: 'equipe_interna' | 'autorizado' | null;
  equipe?: { cor: string | null } | null;
  created_at: string;
};

export function NeoServicosDisponiveis({
  neoInstalacoes,
  neoCorrecoes,
  onAgendarInstalacao,
  onAgendarCorrecao,
  isLoadingInstalacoes,
  isLoadingCorrecoes,
}: NeoServicosDisponiveisProps) {
  const [busca, setBusca] = useState("");
  const [agendandoId, setAgendandoId] = useState<string | null>(null);
  const [agendandoTipo, setAgendandoTipo] = useState<'instalacao' | 'correcao' | null>(null);
  const [dataAgendamento, setDataAgendamento] = useState("");
  const [isAgendando, setIsAgendando] = useState(false);

  // Combinar todos os serviços em uma lista
  const todosServicos: ServicoItem[] = [
    ...neoInstalacoes.map(neo => ({
      id: neo.id,
      tipo: 'instalacao' as const,
      nome_cliente: neo.nome_cliente,
      cidade: neo.cidade,
      estado: neo.estado,
      equipe_nome: neo.equipe_nome,
      autorizado_nome: neo.autorizado_nome,
      tipo_responsavel: neo.tipo_responsavel,
      equipe: neo.equipe,
      created_at: neo.created_at,
    })),
    ...neoCorrecoes.map(neo => ({
      id: neo.id,
      tipo: 'correcao' as const,
      nome_cliente: neo.nome_cliente,
      cidade: neo.cidade,
      estado: neo.estado,
      equipe_nome: neo.equipe_nome,
      autorizado_nome: neo.autorizado_nome,
      tipo_responsavel: neo.tipo_responsavel,
      equipe: neo.equipe,
      created_at: neo.created_at,
    })),
  ];

  // Filtrar por busca
  const servicosFiltrados = todosServicos.filter(servico => {
    const termo = busca.toLowerCase();
    return (
      servico.nome_cliente.toLowerCase().includes(termo) ||
      servico.cidade.toLowerCase().includes(termo) ||
      servico.estado.toLowerCase().includes(termo)
    );
  });

  const handleAbrirAgendar = (id: string, tipo: 'instalacao' | 'correcao') => {
    setAgendandoId(id);
    setAgendandoTipo(tipo);
    setDataAgendamento("");
  };

  const handleConfirmarAgendamento = async () => {
    if (!dataAgendamento) {
      toast.error("Informe a data");
      return;
    }
    if (!agendandoId || !agendandoTipo) return;

    setIsAgendando(true);
    try {
      if (agendandoTipo === 'instalacao') {
        await onAgendarInstalacao(agendandoId, dataAgendamento);
      } else {
        await onAgendarCorrecao(agendandoId, dataAgendamento);
      }
      toast.success("Serviço agendado com sucesso!");
      setAgendandoId(null);
      setAgendandoTipo(null);
    } catch (error) {
      console.error("Erro ao agendar:", error);
      toast.error("Erro ao agendar serviço");
    } finally {
      setIsAgendando(false);
    }
  };

  const isLoading = isLoadingInstalacoes || isLoadingCorrecoes;
  const totalServicos = todosServicos.length;

  if (totalServicos === 0 && !isLoading) {
    return null; // Não mostrar a seção se não houver serviços pendentes
  }

  return (
    <>
      <Card className="border-dashed border-orange-300/50 bg-orange-50/30 dark:bg-orange-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Hammer className="h-4 w-4 text-orange-600" />
                Serviços Avulsos Pendentes
              </CardTitle>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                {totalServicos}
              </Badge>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente, cidade..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[100px]">Tipo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="w-[150px]">Localização</TableHead>
                    <TableHead className="w-[150px]">Responsável</TableHead>
                    <TableHead className="w-[100px] text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servicosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {busca ? "Nenhum serviço encontrado" : "Nenhum serviço pendente de agendamento"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    servicosFiltrados.map((servico) => (
                      <TableRow key={`${servico.tipo}-${servico.id}`} className="hover:bg-muted/20">
                        <TableCell>
                          {servico.tipo === 'instalacao' ? (
                            <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">
                              <Wrench className="h-3 w-3 mr-1" />
                              Instalação
                            </Badge>
                          ) : (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">
                              <Hammer className="h-3 w-3 mr-1" />
                              Correção
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {servico.nome_cliente}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {servico.cidade}/{servico.estado}
                          </div>
                        </TableCell>
                        <TableCell>
                          {servico.tipo_responsavel === 'equipe_interna' && servico.equipe_nome ? (
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: servico.equipe?.cor || '#6366f1' }}
                              />
                              <span className="text-sm">{servico.equipe_nome}</span>
                            </div>
                          ) : servico.autorizado_nome ? (
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3 w-3 text-emerald-600" />
                              <span className="text-sm">{servico.autorizado_nome}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAbrirAgendar(servico.id, servico.tipo)}
                            className="h-7 text-xs"
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            Agendar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Agendamento */}
      <Dialog open={!!agendandoId} onOpenChange={(open) => !open && setAgendandoId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Agendar {agendandoTipo === 'instalacao' ? 'Instalação' : 'Correção'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dataAgendamento">Data *</Label>
              <Input
                id="dataAgendamento"
                type="date"
                value={dataAgendamento}
                onChange={(e) => setDataAgendamento(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAgendandoId(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarAgendamento} disabled={isAgendando}>
              {isAgendando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
