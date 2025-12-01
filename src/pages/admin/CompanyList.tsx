import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useEmpresasEmissoras } from "@/hooks/useEmpresasEmissoras";
import { EmpresaEmissoraCard } from "@/components/admin/EmpresaEmissoraCard";

export default function CompanyList() {
  const navigate = useNavigate();
  const { empresas, isLoading, setPadrao, isSettingPadrao } = useEmpresasEmissoras();

  const handleEdit = (empresa: any) => {
    navigate(`/admin/companies/${empresa.id}`);
  };

  const handleSetPadrao = (id: string) => {
    setPadrao(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Empresas Emissoras</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as empresas que podem emitir notas fiscais
          </p>
        </div>
        <Button onClick={() => navigate('/admin/companies/nova')}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      {!empresas || empresas.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            Nenhuma empresa emissora cadastrada.
          </p>
          <Button onClick={() => navigate('/admin/companies/nova')}>
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar primeira empresa
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {empresas.map((empresa) => (
            <EmpresaEmissoraCard
              key={empresa.id}
              empresa={empresa}
              onEdit={handleEdit}
              onSetPadrao={handleSetPadrao}
              isSettingPadrao={isSettingPadrao}
            />
          ))}
        </div>
      )}
    </div>
  );
}
