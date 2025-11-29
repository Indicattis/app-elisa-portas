import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, Package, Plus, Settings } from "lucide-react";
import { NotasFiscaisList } from "@/components/notas-fiscais/NotasFiscaisList";
import { useNavigate } from "react-router-dom";

export default function NotasFiscais() {
  const navigate = useNavigate();

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
    </div>
  );
}
