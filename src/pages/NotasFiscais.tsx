import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Package, Plus, Settings, RefreshCw, CloudDownload } from "lucide-react";
import { NotasFiscaisList } from "@/components/notas-fiscais/NotasFiscaisList";
import { EmpresaEmissoraSelector } from "@/components/notas-fiscais/EmpresaEmissoraSelector";
import { useNavigate } from "react-router-dom";
import { useNotasFiscais } from "@/hooks/useNotasFiscais";

export default function NotasFiscais() {
  const navigate = useNavigate();
  const { sincronizarNotas, isSincronizando } = useNotasFiscais();
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>("");

  const handleSync = async () => {
    if (!selectedEmpresaId) return;
    
    try {
      await sincronizarNotas(selectedEmpresaId);
      setSyncDialogOpen(false);
      setSelectedEmpresaId("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold">Notas Fiscais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Emissão e gerenciamento de NF-e e NFS-e via Focus NFe
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setSyncDialogOpen(true)}
            disabled={isSincronizando}
          >
            <CloudDownload className="w-4 h-4 mr-2" />
            Importar da Focus
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Criar Nota
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/dashboard/administrativo/financeiro/notas-fiscais/emitir-nfse')}>
                <FileText className="w-4 h-4 mr-2" />
                NFS-e (Serviço)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/administrativo/financeiro/notas-fiscais/emitir-nfe')}>
                <Package className="w-4 h-4 mr-2" />
                NF-e (Produto)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => navigate('/dashboard/administrativo/financeiro/notas-fiscais/configuracoes')}>
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      <NotasFiscaisList />

      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Notas da Focus NFe</DialogTitle>
            <DialogDescription>
              Selecione a empresa emissora para buscar e importar as notas fiscais do painel da Focus NFe.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <EmpresaEmissoraSelector
              value={selectedEmpresaId}
              onChange={setSelectedEmpresaId}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSyncDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSync} 
              disabled={!selectedEmpresaId || isSincronizando}
            >
              {isSincronizando ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <CloudDownload className="w-4 h-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
