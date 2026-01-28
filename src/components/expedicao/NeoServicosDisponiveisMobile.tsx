import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface NeoServicosDisponiveisMobileProps {
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

export function NeoServicosDisponiveisMobile({
  neoInstalacoes,
  neoCorrecoes,
  onAgendarInstalacao,
  onAgendarCorrecao,
  isLoadingInstalacoes,
  isLoadingCorrecoes,
}: NeoServicosDisponiveisMobileProps) {
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
    return null;
  }

  return (
    <>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Hammer className="h-4 w-4 text-orange-600" />
            <h3 className="text-sm font-medium">Serviços Avulsos Pendentes</h3>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs">
              {totalServicos}
            </Badge>
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente, cidade..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Lista de Cards */}
        <div className="max-h-[350px] overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : servicosFiltrados.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              {busca ? "Nenhum serviço encontrado" : "Nenhum serviço pendente"}
            </div>
          ) : (
            servicosFiltrados.map((servico) => (
              <Card 
                key={`${servico.tipo}-${servico.id}`}
                className="p-3 cursor-pointer hover:bg-muted/50 active:bg-muted/70 transition-colors border-border/50"
                onClick={() => handleAbrirAgendar(servico.id, servico.tipo)}
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Info Principal */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {servico.nome_cliente}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {servico.cidade}/{servico.estado}
                      </span>
                    </div>
                    {/* Responsável */}
                    {(servico.equipe_nome || servico.autorizado_nome) && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {servico.tipo_responsavel === 'equipe_interna' && servico.equipe_nome ? (
                          <>
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: servico.equipe?.cor || '#6366f1' }}
                            />
                            <span className="text-xs text-muted-foreground truncate">{servico.equipe_nome}</span>
                          </>
                        ) : servico.autorizado_nome ? (
                          <>
                            <Users className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                            <span className="text-xs text-muted-foreground truncate">{servico.autorizado_nome}</span>
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Lado Direito */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {/* Badge de Tipo */}
                    {servico.tipo === 'instalacao' ? (
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 text-[10px] h-5">
                        <Wrench className="h-3 w-3 mr-1" />
                        Instalação
                      </Badge>
                    ) : (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800 text-[10px] h-5">
                        <Hammer className="h-3 w-3 mr-1" />
                        Correção
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Ação */}
                <div className="flex justify-end mt-2 pt-2 border-t border-border/30">
                  <span className="text-xs text-primary flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Agendar
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

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
              <Label htmlFor="dataAgendamentoMobile">Data *</Label>
              <Input
                id="dataAgendamentoMobile"
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
