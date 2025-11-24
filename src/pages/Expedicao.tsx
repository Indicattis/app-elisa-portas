import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Truck, Calendar, CheckCircle2, Clock } from "lucide-react";
import { useOrdensCarregamento } from "@/hooks/useOrdensCarregamento";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgendarCarregamentoModal } from "@/components/expedicao/AgendarCarregamentoModal";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Expedicao() {
  const [filtroStatus, setFiltroStatus] = useState<string>("todas");
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemCarregamento | null>(null);
  const [modalAgendarOpen, setModalAgendarOpen] = useState(false);

  const { ordens, isLoading, agendarCarregamento, isAgendando } = useOrdensCarregamento({
    status: filtroStatus === "todas" ? undefined : filtroStatus
  });

  const handleAgendar = (ordem: OrdemCarregamento) => {
    setOrdemSelecionada(ordem);
    setModalAgendarOpen(true);
  };

  const handleConfirmarAgendamento = async (data: any) => {
    if (!ordemSelecionada) return;
    await agendarCarregamento({ id: ordemSelecionada.id, data });
  };

  const getPendentes = () => ordens.filter(o => o.status === 'pendente').length;
  const getAgendadas = () => ordens.filter(o => o.status === 'agendada').length;
  const getConcluidas = () => ordens.filter(o => o.status === 'concluida').length;

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-300">Pendente</Badge>;
      case 'agendada':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-300">Agendada</Badge>;
      case 'em_carregamento':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-300">Em Carregamento</Badge>;
      case 'concluida':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-300">Concluída</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Expedição"
        subtitle="Gerenciar ordens de carregamento para entregas e instalações"
        icon={Truck}
      />

      <div className="container mx-auto p-6 space-y-6">
        {/* Indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{getPendentes()}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agendadas</p>
                <p className="text-2xl font-bold">{getAgendadas()}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{getConcluidas()}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <Button
            variant={filtroStatus === "todas" ? "default" : "outline"}
            onClick={() => setFiltroStatus("todas")}
          >
            Todas
          </Button>
          <Button
            variant={filtroStatus === "pendente" ? "default" : "outline"}
            onClick={() => setFiltroStatus("pendente")}
          >
            Pendentes
          </Button>
          <Button
            variant={filtroStatus === "agendada" ? "default" : "outline"}
            onClick={() => setFiltroStatus("agendada")}
          >
            Agendadas
          </Button>
          <Button
            variant={filtroStatus === "concluida" ? "default" : "outline"}
            onClick={() => setFiltroStatus("concluida")}
          >
            Concluídas
          </Button>
        </div>

        {/* Lista de Ordens */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando ordens...</p>
          </div>
        ) : ordens.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma ordem de carregamento encontrada</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {ordens.map((ordem) => (
              <Card key={ordem.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{ordem.nome_cliente}</h3>
                      {getStatusBadge(ordem.status)}
                      <Badge variant="secondary">
                        {ordem.tipo_carregamento === 'entrega' ? 'Entrega' : 'Instalação'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Pedido</p>
                        <p className="font-medium">{ordem.pedido?.numero_pedido || 'N/A'}</p>
                      </div>
                      
                      {ordem.venda && (
                        <div>
                          <p className="text-muted-foreground">Localização</p>
                          <p className="font-medium">{ordem.venda.cidade}/{ordem.venda.estado}</p>
                        </div>
                      )}

                      {ordem.data_carregamento && (
                        <div>
                          <p className="text-muted-foreground">Data Agendada</p>
                          <p className="font-medium">
                            {format(new Date(ordem.data_carregamento), "dd/MM/yyyy", { locale: ptBR })}
                            {ordem.hora && ` às ${ordem.hora}`}
                          </p>
                        </div>
                      )}

                      {ordem.responsavel_carregamento_nome && (
                        <div>
                          <p className="text-muted-foreground">Responsável</p>
                          <p className="font-medium">{ordem.responsavel_carregamento_nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {ordem.responsavel_tipo === 'elisa' ? 'Equipe Elisa' : 'Autorizado'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    {ordem.status === 'pendente' && (
                      <Button
                        onClick={() => handleAgendar(ordem)}
                        disabled={isAgendando}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Agendar
                      </Button>
                    )}
                    {ordem.status === 'agendada' && (
                      <Button
                        variant="outline"
                        onClick={() => handleAgendar(ordem)}
                        disabled={isAgendando}
                      >
                        Reagendar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AgendarCarregamentoModal
        open={modalAgendarOpen}
        onOpenChange={setModalAgendarOpen}
        ordem={ordemSelecionada}
        onConfirm={handleConfirmarAgendamento}
      />
    </div>
  );
}
