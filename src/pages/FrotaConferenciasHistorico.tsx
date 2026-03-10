import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useVeiculos } from "@/hooks/useVeiculos";
import { useConferencias } from "@/hooks/useConferencias";
import { StatusBadge } from "@/components/frota/StatusBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";

export default function FrotaConferenciasHistorico() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { veiculos, isLoading: loadingVeiculos } = useVeiculos();
  const { conferencias, isLoading: loadingConferencias } = useConferencias(id);
  const [selectedFoto, setSelectedFoto] = useState<string | null>(null);

  const veiculo = veiculos?.find(v => v.id === id);

  if (loadingVeiculos || loadingConferencias) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!veiculo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/instalacoes/frota')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <p>Veículo não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard/instalacoes/frota')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Histórico: {veiculo.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {conferencias?.length || 0} conferências registradas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {conferencias?.map((conferencia) => (
          <Card
            key={conferencia.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedFoto(conferencia.foto_url)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                <img
                  src={conferencia.foto_url}
                  alt="Foto da conferência"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(conferencia.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <StatusBadge status={conferencia.status as any} />
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>Km:</strong> {conferencia.km_atual.toLocaleString('pt-BR')}</p>
                    {conferencia.data_troca_oleo && (
                      <p><strong>Troca óleo:</strong> {format(new Date(conferencia.data_troca_oleo), "dd/MM/yyyy", { locale: ptBR })}</p>
                    )}
                    <p><strong>Água:</strong> {conferencia.agua_conferida ? 'Conferida ✓' : 'Não conferida'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {conferencias?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhuma conferência registrada para este veículo
          </div>
        )}
      </div>

      <Dialog open={!!selectedFoto} onOpenChange={() => setSelectedFoto(null)}>
        <DialogContent className="max-w-4xl">
          {selectedFoto && (
            <img
              src={selectedFoto}
              alt="Foto em detalhe"
              className="w-full h-auto"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
