import { useState } from "react";
import { Truck } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CadastroEntregaForm } from "@/components/entregas/CadastroEntregaForm";
import { EntregasTabelaView } from "@/components/entregas/EntregasTabelaView";
import { EntregasIndicadores } from "@/components/entregas/EntregasIndicadores";
import { useEntregas } from "@/hooks/useEntregas";

export default function Entregas() {
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();

  const { 
    entregas, 
    createEntrega, 
    deleteEntrega, 
    updateEntrega,
    updateStatus 
  } = useEntregas();

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Entregas</h1>
            <p className="text-sm text-muted-foreground">
              Visualize e gerencie todas as entregas cadastradas
            </p>
          </div>
          
          <div className="flex gap-2">
            {isAdmin && (
              <Button 
                onClick={() => setShowCadastroModal(true)}
                size={isMobile ? "sm" : "default"}
                className="gap-2"
              >
                <Truck className="h-4 w-4" />
                {!isMobile && "Nova Entrega"}
              </Button>
            )}
          </div>
        </div>

        <EntregasIndicadores entregas={entregas} />

        <EntregasTabelaView
          entregas={entregas}
          onDelete={deleteEntrega}
          onUpdate={updateEntrega}
          onUpdateStatus={updateStatus}
          isAdmin={isAdmin}
        />
      </div>

      <Dialog open={showCadastroModal} onOpenChange={setShowCadastroModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Entrega</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar uma nova entrega
            </DialogDescription>
          </DialogHeader>
          <CadastroEntregaForm 
            onSubmit={async (data) => {
              await createEntrega(data);
              setShowCadastroModal(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
