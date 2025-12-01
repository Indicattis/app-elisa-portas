import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Package, Plus, Settings, Ban, Loader2 } from "lucide-react";
import { NotasFiscaisList } from "@/components/notas-fiscais/NotasFiscaisList";
import { EmpresaEmissoraSelector } from "@/components/notas-fiscais/EmpresaEmissoraSelector";
import { useNavigate } from "react-router-dom";
import { useNotasFiscais } from "@/hooks/useNotasFiscais";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function NotasFiscais() {
  const navigate = useNavigate();
  const { cancelarNotaPorReferencia, isCancelandoPorReferencia } = useNotasFiscais();
  
  // State for cancel by reference dialog
  const [cancelRefDialogOpen, setCancelRefDialogOpen] = useState(false);
  const [empresaEmissoraId, setEmpresaEmissoraId] = useState("");
  const [referencia, setReferencia] = useState("");
  const [tipoNota, setTipoNota] = useState<"nfe" | "nfse">("nfe");
  const [motivoCancelamento, setMotivoCancelamento] = useState("");

  const handleCancelByReference = async () => {
    if (!empresaEmissoraId || !referencia || !motivoCancelamento || motivoCancelamento.length < 15) return;

    try {
      await cancelarNotaPorReferencia({
        empresaEmissoraId,
        referencia,
        tipoNota,
        motivo: motivoCancelamento
      });
      setCancelRefDialogOpen(false);
      resetCancelForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetCancelForm = () => {
    setEmpresaEmissoraId("");
    setReferencia("");
    setTipoNota("nfe");
    setMotivoCancelamento("");
  };

  const handleDialogClose = (open: boolean) => {
    setCancelRefDialogOpen(open);
    if (!open) {
      resetCancelForm();
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
            onClick={() => setCancelRefDialogOpen(true)}
          >
            <Ban className="w-4 h-4 mr-2" />
            Cancelar por Referência
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

      {/* Dialog: Cancelar por Referência */}
      <Dialog open={cancelRefDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar Nota por Referência</DialogTitle>
            <DialogDescription>
              Cancele uma nota fiscal diretamente na Focus NFe informando a referência. Use esta opção para notas que não estão registradas no sistema local.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Empresa Emissora</Label>
              <EmpresaEmissoraSelector
                value={empresaEmissoraId}
                onChange={setEmpresaEmissoraId}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referencia">Referência da Nota</Label>
              <Input
                id="referencia"
                placeholder="Ex: 123456789"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A referência (ref) usada ao emitir a nota na Focus NFe
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tipo da Nota</Label>
              <RadioGroup
                value={tipoNota}
                onValueChange={(value) => setTipoNota(value as "nfe" | "nfse")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nfe" id="tipo-nfe" />
                  <Label htmlFor="tipo-nfe" className="cursor-pointer">NF-e (Produto)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nfse" id="tipo-nfse" />
                  <Label htmlFor="tipo-nfse" className="cursor-pointer">NFS-e (Serviço)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo do Cancelamento</Label>
              <Textarea
                id="motivo"
                placeholder="Informe o motivo do cancelamento (mínimo 15 caracteres)"
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex justify-between text-xs">
                <span className={motivoCancelamento.length < 15 ? "text-destructive" : "text-muted-foreground"}>
                  Mínimo 15 caracteres
                </span>
                <span className={motivoCancelamento.length < 15 ? "text-destructive" : "text-muted-foreground"}>
                  {motivoCancelamento.length}/15
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogClose(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelByReference}
              disabled={!empresaEmissoraId || !referencia || motivoCancelamento.length < 15 || isCancelandoPorReferencia}
            >
              {isCancelandoPorReferencia ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  Confirmar Cancelamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
