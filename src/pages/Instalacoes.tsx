import { useState } from "react";
import { MapPin, Filter } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CadastroInstalacaoForm } from "@/components/cadastro-instalacao/CadastroInstalacaoForm";
import { InstalacoesTabelaView } from "@/components/cadastro-instalacao/InstalacoesTabelaView";
import { InstalacaoIndicadores } from "@/components/cadastro-instalacao/InstalacaoIndicadores";
import { InstalacoesFiltros } from "@/components/cadastro-instalacao/InstalacoesFiltros";
import { useInstalacoesCadastradas } from "@/hooks/useInstalacoesCadastradas";
import { useInstalacoesFilters } from "@/hooks/useInstalacoesFilters";

export default function Instalacoes() {
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  const [mostrarConcluidos, setMostrarConcluidos] = useState(false);
  
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();

  const { 
    instalacoes, 
    createInstalacao, 
    deleteInstalacao, 
    updateInstalacao,
    updateStatus,
    concluirInstalacao,
    geocodeInstalacao
  } = useInstalacoesCadastradas();

  const {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterEstado,
    setFilterEstado,
    filteredInstalacoes: baseFilteredInstalacoes,
    estados,
  } = useInstalacoesFilters(instalacoes);

  // Aplicar filtro adicional para ocultar concluídos por padrão
  const filteredInstalacoes = baseFilteredInstalacoes.filter(instalacao => {
    if (mostrarConcluidos) return true;
    return !instalacao.instalacao_concluida;
  });

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Instalações</h1>
            <p className="text-sm text-muted-foreground">
              Visualize e gerencie todas as instalações cadastradas
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={mostrarConcluidos ? "outline" : "default"}
              size={isMobile ? "sm" : "default"}
              onClick={() => setMostrarConcluidos(!mostrarConcluidos)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {!isMobile && (mostrarConcluidos ? "Mostrar Apenas Pendentes" : "Mostrar Todos")}
              {isMobile && <Badge variant="secondary" className="text-xs">{filteredInstalacoes.length}</Badge>}
            </Button>
            
            {isAdmin && (
              <Button 
                onClick={() => setShowCadastroModal(true)}
                size={isMobile ? "sm" : "default"}
                className="gap-2"
              >
                <MapPin className="h-4 w-4" />
                {!isMobile && "Nova Instalação"}
              </Button>
            )}
          </div>
        </div>

        <InstalacaoIndicadores instalacoes={instalacoes} />

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
          onDelete={deleteInstalacao}
          onUpdate={updateInstalacao}
          onUpdateStatus={updateStatus}
          onConcluirInstalacao={concluirInstalacao}
          onGeocode={geocodeInstalacao}
          isAdmin={isAdmin}
        />
      </div>

      <Dialog open={showCadastroModal} onOpenChange={setShowCadastroModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Instalação</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar uma nova instalação
            </DialogDescription>
          </DialogHeader>
          <CadastroInstalacaoForm 
            onSubmit={async (data) => {
              await createInstalacao(data);
              setShowCadastroModal(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
