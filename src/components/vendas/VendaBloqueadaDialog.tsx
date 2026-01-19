import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, FileText, Package, Lock } from "lucide-react";
import { BlockReason } from "@/hooks/useCanEditVenda";

interface VendaBloqueadaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockReason: BlockReason;
  pedidoId?: string | null;
}

export function VendaBloqueadaDialog({
  open,
  onOpenChange,
  blockReason,
  pedidoId
}: VendaBloqueadaDialogProps) {
  const getTitle = () => {
    switch (blockReason) {
      case 'faturada':
        return 'Venda Faturada';
      case 'com_pedido':
        return 'Venda com Pedido';
      case 'ambos':
        return 'Venda Faturada e com Pedido';
      case 'nao_proprietario':
        return 'Sem Permissão';
      default:
        return 'Edição Bloqueada';
    }
  };

  const getIcon = () => {
    switch (blockReason) {
      case 'faturada':
        return <FileText className="h-6 w-6 text-yellow-500" />;
      case 'com_pedido':
        return <Package className="h-6 w-6 text-blue-500" />;
      case 'ambos':
        return <AlertTriangle className="h-6 w-6 text-orange-500" />;
      case 'nao_proprietario':
        return <Lock className="h-6 w-6 text-red-500" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getDescription = () => {
    switch (blockReason) {
      case 'faturada':
        return (
          <div className="space-y-3">
            <p>Esta venda já foi <strong>faturada</strong> e não pode ser editada diretamente.</p>
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium mb-2">Para editar esta venda:</p>
              <ol className="text-sm list-decimal list-inside space-y-1">
                <li>Acesse a página de <strong>Faturamento</strong></li>
                <li>Clique em <strong>"Remover Faturamento"</strong></li>
                <li>Depois retorne aqui para editar</li>
              </ol>
            </div>
            <p className="text-sm text-muted-foreground">
              Se você não tem acesso ao faturamento, fale com o administrador.
            </p>
          </div>
        );
      case 'com_pedido':
        return (
          <div className="space-y-3">
            <p>Esta venda possui um <strong>pedido de produção</strong> vinculado e não pode ser editada.</p>
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium mb-2">Para editar esta venda:</p>
              <ol className="text-sm list-decimal list-inside space-y-1">
                <li>Acesse o <strong>pedido de produção</strong></li>
                <li><strong>Exclua o pedido</strong> vinculado</li>
                <li>Depois retorne aqui para editar</li>
              </ol>
            </div>
            <p className="text-sm text-muted-foreground">
              Fale com o administrador para excluir o pedido.
            </p>
          </div>
        );
      case 'ambos':
        return (
          <div className="space-y-3">
            <p>Esta venda está <strong>faturada</strong> e possui um <strong>pedido de produção</strong> vinculado.</p>
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium mb-2">Para editar esta venda, é necessário:</p>
              <ol className="text-sm list-decimal list-inside space-y-1">
                <li><strong>Excluir o pedido</strong> de produção vinculado</li>
                <li><strong>Remover o faturamento</strong> da venda</li>
                <li>Depois retorne aqui para editar</li>
              </ol>
            </div>
            <p className="text-sm text-muted-foreground">
              Fale com o administrador para realizar essas ações.
            </p>
          </div>
        );
      case 'nao_proprietario':
        return (
          <div className="space-y-3">
            <p>Você <strong>não é o criador</strong> desta venda e não tem permissão para editá-la.</p>
            <p className="text-sm text-muted-foreground">
              Apenas o vendedor que criou a venda ou um administrador pode editá-la.
            </p>
          </div>
        );
      default:
        return <p>Esta venda não pode ser editada no momento.</p>;
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            {getDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            Entendi
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
