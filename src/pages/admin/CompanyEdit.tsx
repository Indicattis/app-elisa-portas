import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmpresasEmissoras } from "@/hooks/useEmpresasEmissoras";
import { EmpresaEmissoraForm } from "@/components/admin/EmpresaEmissoraForm";
import { EmpresaEmissoraFormData } from "@/types/empresaEmissora";

export default function CompanyEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { empresas, isLoading, createEmpresa, updateEmpresa, isCreating, isUpdating } = useEmpresasEmissoras();

  const isNew = id === 'nova';
  const empresa = isNew ? undefined : empresas?.find(e => e.id === id);

  const handleSubmit = (data: EmpresaEmissoraFormData) => {
    if (isNew) {
      createEmpresa(data, {
        onSuccess: () => navigate('/admin/companies')
      });
    } else if (empresa) {
      updateEmpresa({ ...empresa, ...data }, {
        onSuccess: () => navigate('/admin/companies')
      });
    }
  };

  const handleCancel = () => {
    navigate('/admin/companies');
  };

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isNew && !empresa) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Empresa não encontrada.</p>
        <Button onClick={() => navigate('/admin/companies')}>
          Voltar para listagem
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isNew ? 'Nova Empresa Emissora' : 'Editar Empresa Emissora'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isNew 
              ? 'Cadastre uma nova empresa para emissão de notas fiscais'
              : 'Atualize os dados da empresa emissora'
            }
          </p>
        </div>
      </div>

      <EmpresaEmissoraForm
        empresa={empresa}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isCreating || isUpdating}
      />
    </div>
  );
}
