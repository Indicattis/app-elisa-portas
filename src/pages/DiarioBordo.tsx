import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Plus, Search, Users, FileText, Filter } from 'lucide-react';
import { NovaAtaModal } from '@/components/diario-bordo/NovaAtaModal';
import { SelecionarParticipantesModal } from '@/components/diario-bordo/SelecionarParticipantesModal';
import { DetalhesAtaModal } from '@/components/diario-bordo/DetalhesAtaModal';
import { useAtas, useCreateAta, FiltrosAtas } from '@/hooks/useAtas';
import { formatDuration } from '@/utils/timeFormat';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DiarioBordo() {
  const [showNovaAtaModal, setShowNovaAtaModal] = useState(false);
  const [showParticipantesModal, setShowParticipantesModal] = useState(false);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [selectedAtaId, setSelectedAtaId] = useState<string | null>(null);
  const [pendingAtaData, setPendingAtaData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState<FiltrosAtas>({});

  const { data: atas = [], isLoading } = useAtas(filtros);
  const createAtaMutation = useCreateAta();

  const handleNovaAta = () => {
    setShowNovaAtaModal(true);
  };

  const handleFinalizeAta = (data: any) => {
    setPendingAtaData(data);
    setShowNovaAtaModal(false);
    setShowParticipantesModal(true);
  };

  const handleConfirmParticipantes = async (participantes: string[]) => {
    if (!pendingAtaData) return;

    await createAtaMutation.mutateAsync({
      assunto: pendingAtaData.assunto,
      conteudo: pendingAtaData.conteudo,
      duracao_segundos: pendingAtaData.duracao,
      data_inicio: pendingAtaData.dataInicio,
      data_fim: pendingAtaData.dataFim,
      participantes,
    });

    setPendingAtaData(null);
    setShowParticipantesModal(false);
  };

  const handleVoltarParaEdicao = () => {
    setShowParticipantesModal(false);
    setShowNovaAtaModal(true);
  };

  const handleViewDetails = (ataId: string) => {
    setSelectedAtaId(ataId);
    setShowDetalhesModal(true);
  };

  const filteredAtas = atas.filter(
    (ata) =>
      ata.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ata.conteudo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserInitials = (nome: string) => {
    return nome
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diário de Bordo</h1>
          <p className="text-muted-foreground">
            Registre e acompanhe as atas de reuniões
          </p>
        </div>
        <Button onClick={handleNovaAta} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Nova Ata de Reunião
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por assunto ou conteúdo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Listagem de Atas */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredAtas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-6 mb-4">
              <FileText className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma ata registrada</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {searchTerm
                ? 'Nenhuma ata encontrada com os filtros aplicados.'
                : 'Comece registrando sua primeira ata de reunião clicando no botão acima.'}
            </p>
            {!searchTerm && (
              <Button onClick={handleNovaAta} size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Registrar Primeira Ata
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAtas.map((ata) => (
            <Card
              key={ata.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
              onClick={() => handleViewDetails(ata.id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg line-clamp-2">{ata.assunto}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {ata.conteudo}
                </p>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(ata.data_inicio), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(ata.duracao_segundos)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{ata.participantes.length} participante{ata.participantes.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <Separator />

                {/* Avatares dos participantes */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {ata.participantes.slice(0, 5).map((participante) => (
                      <Avatar key={participante.user_id} className="h-8 w-8 border-2 border-background">
                        <AvatarImage src={participante.admin_users?.foto_perfil_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(participante.admin_users?.nome || '')}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {ata.participantes.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{ata.participantes.length - 5}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modais */}
      <NovaAtaModal
        open={showNovaAtaModal}
        onOpenChange={setShowNovaAtaModal}
        onFinalize={handleFinalizeAta}
      />

      <SelecionarParticipantesModal
        open={showParticipantesModal}
        onOpenChange={setShowParticipantesModal}
        onConfirm={handleConfirmParticipantes}
        onVoltar={handleVoltarParaEdicao}
        duracao={pendingAtaData?.duracao || 0}
      />

      <DetalhesAtaModal
        open={showDetalhesModal}
        onOpenChange={setShowDetalhesModal}
        ataId={selectedAtaId}
      />
    </div>
  );
}
