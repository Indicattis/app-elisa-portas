import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useVeiculos } from "@/hooks/useVeiculos";
import { useConferencias } from "@/hooks/useConferencias";
import { CameraCapture } from "@/components/frota/CameraCapture";
import { ConferenciaForm, ConferenciaFormData } from "@/components/frota/ConferenciaForm";
import { StatusBadge } from "@/components/frota/StatusBadge";

export default function FrotaConferencia() {
  const navigate = useNavigate();
  const { veiculos, isLoading, updateVeiculo } = useVeiculos();
  const { createConferencia, uploadFotoConferencia, isCreating, isUploading } = useConferencias();

  const [selectedVeiculo, setSelectedVeiculo] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleVeiculoSelect = (veiculoId: string) => {
    setSelectedVeiculo(veiculoId);
  };

  const handlePhotoCapture = (file: File) => {
    setCapturedPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCancelPhoto = () => {
    setCapturedPhoto(null);
    setPhotoPreview(null);
  };

  const handleCancelVeiculo = () => {
    setSelectedVeiculo(null);
    setCapturedPhoto(null);
    setPhotoPreview(null);
  };

  const handleSubmitConferencia = async (data: ConferenciaFormData) => {
    if (!selectedVeiculo || !capturedPhoto) return;

    const foto_url = await uploadFotoConferencia({
      file: capturedPhoto,
      veiculo_id: selectedVeiculo
    });

    await createConferencia({
      veiculo_id: selectedVeiculo,
      foto_url,
      km_atual: data.km_atual,
      data_troca_oleo: data.data_troca_oleo || undefined,
      agua_conferida: data.agua_conferida,
      observacoes: data.observacoes,
      status: veiculo?.status === 'rodando' ? 'em_uso' : veiculo?.status === 'parado' ? 'pronto' : 'mecanico'
    });

    navigate('/dashboard/instalacoes/frota');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Etapa 1: Selecionar veículo
  if (!selectedVeiculo) {
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
            <h1 className="text-2xl font-bold">Conferir Veículo</h1>
            <p className="text-sm text-muted-foreground">
              Selecione o veículo para conferência
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {veiculos?.map((veiculo) => (
            <Card
              key={veiculo.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleVeiculoSelect(veiculo.id)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {veiculo.foto_url ? (
                    <img
                      src={veiculo.foto_url}
                      alt={veiculo.nome}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                      Sem foto
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{veiculo.nome}</h3>
                    <p className="text-sm text-muted-foreground">{veiculo.modelo}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ano: {veiculo.ano}</span>
                    <StatusBadge status={veiculo.status} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const veiculo = veiculos?.find(v => v.id === selectedVeiculo);

  // Etapa 2: Capturar foto
  if (!capturedPhoto || !photoPreview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelVeiculo}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Conferir: {veiculo?.nome}</h1>
            <p className="text-sm text-muted-foreground">
              Tire uma foto do veículo
            </p>
          </div>
        </div>

        <CameraCapture 
          onCapture={handlePhotoCapture}
          onCancel={handleCancelVeiculo}
        />
      </div>
    );
  }

  // Etapa 3: Preencher formulário
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancelPhoto}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Conferir: {veiculo?.nome}</h1>
          <p className="text-sm text-muted-foreground">
            Preencha os dados da conferência
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <ConferenciaForm
            fotoPreview={photoPreview}
            onSubmit={handleSubmitConferencia}
            onCancel={handleCancelPhoto}
            isSubmitting={isCreating || isUploading}
            initialKmAtual={veiculo?.km_atual}
          />
        </CardContent>
      </Card>
    </div>
  );
}
