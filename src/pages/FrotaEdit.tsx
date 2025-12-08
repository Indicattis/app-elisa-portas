import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VeiculoForm } from "@/components/frota/VeiculoForm";
import { ConferenciasListagem } from "@/components/frota/ConferenciasListagem";
import { useVeiculos, VeiculoFormData } from "@/hooks/useVeiculos";
import { useConferencias } from "@/hooks/useConferencias";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FrotaEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { veiculos, updateVeiculo, uploadFoto, isUpdating, isUploading } = useVeiculos();
  const { conferencias, isLoading: isLoadingConferencias } = useConferencias(id);

  const veiculo = veiculos?.find(v => v.id === id);

  useEffect(() => {
    if (!id || (veiculos && !veiculo)) {
      navigate('/dashboard/logistica/frota');
    }
  }, [id, veiculo, veiculos, navigate]);

  const handleSubmit = async (data: VeiculoFormData & { foto?: File }) => {
    if (!id) return;

    let foto_url = data.foto_url;
    
    if (data.foto) {
      foto_url = await uploadFoto({ file: data.foto, veiculo_id: id });
    }

    const { foto, ...veiculoData } = data;

    await updateVeiculo({
      id,
      data: {
        ...veiculoData,
        foto_url
      }
    });

    navigate('/dashboard/logistica/frota');
  };

  if (!veiculo) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard/logistica/frota')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Veículo</h1>
          <p className="text-sm text-muted-foreground">
            Atualize as informações do veículo
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Veículo</CardTitle>
          <CardDescription>
            Atualize as informações do veículo {veiculo.nome}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VeiculoForm 
            onSubmit={handleSubmit} 
            initialData={veiculo}
            isSubmitting={isUpdating || isUploading}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Conferências</CardTitle>
          <CardDescription>
            {conferencias?.length || 0} conferência(s) registrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConferenciasListagem 
            conferencias={conferencias || []} 
            isLoading={isLoadingConferencias} 
          />
        </CardContent>
      </Card>
    </div>
  );
}