import { useState } from "react";
import { MapPin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExpedicaoForm } from "@/components/expedicao/ExpedicaoForm";
import { ExpedicaoTabela } from "@/components/expedicao/ExpedicaoTabela";
import { ExpedicaoIndicadores } from "@/components/expedicao/ExpedicaoIndicadores";
import { ExpedicaoFiltros } from "@/components/expedicao/ExpedicaoFiltros";
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

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");

  const filteredOrdens = ordens.filter((ordem) => {
    const matchesSearch = ordem.nome_cliente
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "todos" ||
      (filterStatus === "concluido" && ordem.carregamento_concluido) ||
      (filterStatus === "pendente" && !ordem.carregamento_concluido);
    return matchesSearch && matchesStatus;
  });

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

        <ExpedicaoIndicadores ordens={ordens} />

        <ExpedicaoFiltros
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
        />

        <ExpedicaoTabela 
          ordens={filteredOrdens} 
          onConcluir={async (id) => {
            await concluirOrdem(id);
          }} 
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
          <ExpedicaoForm 
            onSubmit={async (data) => {
              await createOrdem(data);
              setShowCadastroModal(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
