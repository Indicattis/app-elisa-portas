import { useState } from "react";
import { MapPin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CadastroInstalacaoForm } from "@/components/cadastro-instalacao/CadastroInstalacaoForm";
import { InstalacoesTabelaView } from "@/components/cadastro-instalacao/InstalacoesTabelaView";
import { InstalacaoIndicadores } from "@/components/cadastro-instalacao/InstalacaoIndicadores";
import { InstalacoesFiltros } from "@/components/cadastro-instalacao/InstalacoesFiltros";
import { useOrdensCarregamento } from "@/hooks/useOrdensCarregamento";
import { useInstalacoesFilters } from "@/hooks/useInstalacoesFilters";

export default function Expedicao() {
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();

  const { 
    ordens, 
    loading,
    createOrdem, 
    concluirOrdem,
  } = useOrdensCarregamento();

  const {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterEstado,
    setFilterEstado,
    filteredInstalacoes,
    estados,
  } = useInstalacoesFilters(ordens);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Expedição</h1>
            <p className="text-sm text-muted-foreground">
              Visualize e gerencie todas as ordens de carregamento
            </p>
          </div>
          
          <div className="flex gap-2">
            {isAdmin && (
              <Button 
                onClick={() => setShowCadastroModal(true)}
                size={isMobile ? "sm" : "default"}
                className="gap-2"
              >
                <MapPin className="h-4 w-4" />
                {!isMobile && "Nova Ordem"}
              </Button>
            )}
          </div>
        </div>

        <InstalacaoIndicadores instalacoes={ordens} />

        <InstalacoesFiltros
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          filterEstado={filterEstado}
          onFilterEstadoChange={setFilterEstado}
          estados={estados}
        />

        <InstalacoesTabelaView
          instalacoes={filteredInstalacoes}
          onDelete={async () => {}}
          onUpdate={async () => {}}
          onUpdateStatus={async () => {}}
          onConcluirInstalacao={concluirOrdem}
          onGeocode={async () => {}}
          isAdmin={isAdmin}
        />
      </div>

      <Dialog open={showCadastroModal} onOpenChange={setShowCadastroModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Ordem de Carregamento</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar uma nova ordem de carregamento
            </DialogDescription>
          </DialogHeader>
          <CadastroInstalacaoForm 
            onSubmit={async (data) => {
              await createOrdem(data as any);
              setShowCadastroModal(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
