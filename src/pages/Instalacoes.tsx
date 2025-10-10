import { useState } from "react";
import { MapPin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CadastroInstalacaoForm } from "@/components/cadastro-instalacao/CadastroInstalacaoForm";
import { InstalacoesTabelaView } from "@/components/cadastro-instalacao/InstalacoesTabelaView";
import { InstalacaoIndicadores } from "@/components/cadastro-instalacao/InstalacaoIndicadores";
import { useInstalacoesCadastradas } from "@/hooks/useInstalacoesCadastradas";

export default function Instalacoes() {
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();

  const { 
    instalacoes, 
    createInstalacao, 
    deleteInstalacao, 
    updateInstalacao,
    alterarParaCorrecao,
    updateStatus 
  } = useInstalacoesCadastradas();

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

        <InstalacoesTabelaView
          instalacoes={instalacoes}
          onDelete={deleteInstalacao}
          onUpdate={updateInstalacao}
          onAlterarParaCorrecao={alterarParaCorrecao}
          onUpdateStatus={updateStatus}
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
