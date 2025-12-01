import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmpresasEmissoras } from "@/hooks/useEmpresasEmissoras";
import { EmpresaEmissoraCard } from "@/components/admin/EmpresaEmissoraCard";
import { EmpresaEmissoraForm } from "@/components/admin/EmpresaEmissoraForm";
import { EmpresaEmissora, EmpresaEmissoraFormData } from "@/types/empresaEmissora";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export default function CompanySettings() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaEmissora | undefined>();
  
  const {
    empresas,
    isLoading,
    createEmpresa,
    updateEmpresa,
    setPadrao,
    isCreating,
    isUpdating,
    isSettingPadrao
  } = useEmpresasEmissoras();

  const handleOpenDialog = (empresa?: EmpresaEmissora) => {
    setEditingEmpresa(empresa);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEmpresa(undefined);
  };

  const handleSubmit = (data: EmpresaEmissoraFormData) => {
    if (editingEmpresa) {
      updateEmpresa({ id: editingEmpresa.id, ...data });
    } else {
      createEmpresa(data);
    }
    handleCloseDialog();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Empresas Emissoras</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gerencie as empresas que podem emitir notas fiscais
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      {empresas && empresas.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Building2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma empresa cadastrada</h3>
          <p className="text-muted-foreground mb-4">
            Cadastre sua primeira empresa emissora para começar
          </p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Primeira Empresa
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {empresas?.map((empresa) => (
            <EmpresaEmissoraCard
              key={empresa.id}
              empresa={empresa}
              onEdit={handleOpenDialog}
              onSetPadrao={setPadrao}
              isSettingPadrao={isSettingPadrao}
            />
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmpresa ? 'Editar Empresa' : 'Nova Empresa'}
            </DialogTitle>
          </DialogHeader>
          <EmpresaEmissoraForm
            empresa={editingEmpresa}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
            isSubmitting={isCreating || isUpdating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
