import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VeiculoForm } from "@/components/frota/VeiculoForm";
import { useVeiculos, VeiculoFormData } from "@/hooks/useVeiculos";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FrotaNovo() {
  const navigate = useNavigate();
  const { createVeiculo, uploadFoto, uploadDocumento, isCreating, isUploading, isUploadingDocumento } = useVeiculos();

  const handleSubmit = async (data: VeiculoFormData & { foto?: File; documento?: File }) => {
    let foto_url = data.foto_url;
    let documento_url = data.documento_url;
    let documento_nome = data.documento_nome;
    
    if (data.foto) {
      foto_url = await uploadFoto({ file: data.foto });
    }

    if (data.documento) {
      const result = await uploadDocumento({ file: data.documento });
      documento_url = result.url;
      documento_nome = result.nome;
    }

    const { foto, documento, ...veiculoData } = data;

    await createVeiculo({
      ...veiculoData,
      foto_url,
      documento_url,
      documento_nome
    });

    navigate('/dashboard/instalacoes/frota');
  };

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
          <h1 className="text-2xl font-bold">Novo Veículo</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre um novo veículo da frota
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Veículo</CardTitle>
          <CardDescription>
            Preencha as informações do veículo a ser cadastrado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VeiculoForm 
            onSubmit={handleSubmit} 
            isSubmitting={isCreating || isUploading || isUploadingDocumento}
          />
        </CardContent>
      </Card>
    </div>
  );
}
