import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useCreateCliente, ClienteFormData } from '@/hooks/useClientes';
import { ClienteForm } from './ClienteForm';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NovoClienteMinimalistaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NovoClienteMinimalistaModal({ 
  open, 
  onOpenChange,
  onSuccess 
}: NovoClienteMinimalistaModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { mutate: createCliente, isPending } = useCreateCliente();

  const handleSubmit = (data: ClienteFormData) => {
    createCliente(data, {
      onSuccess: () => {
        toast.success('Cliente cadastrado com sucesso!');
        queryClient.invalidateQueries({ queryKey: ['meus-clientes', user?.id] });
        onOpenChange(false);
        onSuccess?.();
      },
      onError: (error) => {
        toast.error('Erro ao cadastrar cliente');
        console.error(error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Novo Cliente</DialogTitle>
          <DialogDescription className="text-white/60">
            Preencha os dados para cadastrar um novo cliente
          </DialogDescription>
        </DialogHeader>

        {/* Wrapper para estilizar o formulário no tema escuro */}
        <div className="
          [&_label]:text-white/80
          [&_input]:bg-white/5 [&_input]:border-white/10 [&_input]:text-white [&_input]:placeholder:text-white/40
          [&_input:focus]:border-blue-500/50 [&_input:focus]:ring-blue-500/20
          [&_textarea]:bg-white/5 [&_textarea]:border-white/10 [&_textarea]:text-white [&_textarea]:placeholder:text-white/40
          [&_textarea:focus]:border-blue-500/50 [&_textarea:focus]:ring-blue-500/20
          [&_button[role=combobox]]:bg-white/5 [&_button[role=combobox]]:border-white/10 [&_button[role=combobox]]:text-white
          [&_button[role=combobox]:hover]:bg-white/10
          [&_[data-placeholder]]:text-white/40
          [&_.text-destructive]:text-red-400
          [&_.text-muted-foreground]:text-white/50
          [&_[data-state=checked]]:bg-blue-600 [&_[data-state=checked]]:border-blue-600
        ">
          <ClienteForm 
            onSubmit={handleSubmit} 
            isLoading={isPending} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
