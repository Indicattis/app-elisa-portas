import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItemTabelaPreco, ItemTabelaPrecoInput } from "@/hooks/useTabelaPrecos";
import { useEffect } from "react";

interface ItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (dados: ItemTabelaPrecoInput) => Promise<void>;
  itemEditando?: ItemTabelaPreco | null;
}

export function ItemModal({ open, onOpenChange, onSubmit, itemEditando }: ItemModalProps) {
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<ItemTabelaPrecoInput>({
    defaultValues: itemEditando || {
      descricao: '',
      largura: 0,
      altura: 0,
      valor_porta: 0,
      valor_instalacao: 0,
      valor_pintura: 0,
      lucro: 0,
    }
  });

  useEffect(() => {
    if (itemEditando) {
      reset(itemEditando);
    } else {
      reset({
        descricao: '',
        largura: 0,
        altura: 0,
        valor_porta: 0,
        valor_instalacao: 0,
        valor_pintura: 0,
        lucro: 0,
      });
    }
  }, [itemEditando, reset, open]);

  const valorPorta = watch('valor_porta') || 0;
  const valorInstalacao = watch('valor_instalacao') || 0;
  const valorPintura = watch('valor_pintura') || 0;
  const valorTotal = Number(valorPorta) + Number(valorInstalacao) + Number(valorPintura);

  const handleFormSubmit = async (dados: ItemTabelaPrecoInput) => {
    await onSubmit({
      ...dados,
      largura: Number(dados.largura),
      altura: Number(dados.altura),
      valor_porta: Number(dados.valor_porta),
      valor_instalacao: Number(dados.valor_instalacao),
      valor_pintura: Number(dados.valor_pintura),
      lucro: Number(dados.lucro),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {itemEditando ? 'Editar Item' : 'Novo Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              {...register('descricao', { required: 'Descrição é obrigatória' })}
              placeholder="Ex: Porta Padrão"
            />
            {errors.descricao && (
              <p className="text-sm text-destructive">{errors.descricao.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="largura">Largura (m) *</Label>
              <Input
                id="largura"
                type="number"
                step="0.01"
                {...register('largura', { 
                  required: 'Largura é obrigatória',
                  min: { value: 0.01, message: 'Largura deve ser maior que 0' }
                })}
                placeholder="3.00"
              />
              {errors.largura && (
                <p className="text-sm text-destructive">{errors.largura.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="altura">Altura (m) *</Label>
              <Input
                id="altura"
                type="number"
                step="0.01"
                {...register('altura', { 
                  required: 'Altura é obrigatória',
                  min: { value: 0.01, message: 'Altura deve ser maior que 0' }
                })}
                placeholder="2.50"
              />
              {errors.altura && (
                <p className="text-sm text-destructive">{errors.altura.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_porta">Valor Porta *</Label>
              <Input
                id="valor_porta"
                type="number"
                step="0.01"
                {...register('valor_porta', { 
                  required: 'Valor da porta é obrigatório',
                  min: { value: 0, message: 'Valor deve ser maior ou igual a 0' }
                })}
                placeholder="2500.00"
              />
              {errors.valor_porta && (
                <p className="text-sm text-destructive">{errors.valor_porta.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_instalacao">Valor Instalação *</Label>
              <Input
                id="valor_instalacao"
                type="number"
                step="0.01"
                {...register('valor_instalacao', { 
                  required: 'Valor da instalação é obrigatório',
                  min: { value: 0, message: 'Valor deve ser maior ou igual a 0' }
                })}
                placeholder="350.00"
              />
              {errors.valor_instalacao && (
                <p className="text-sm text-destructive">{errors.valor_instalacao.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_pintura">Valor Pintura *</Label>
              <Input
                id="valor_pintura"
                type="number"
                step="0.01"
                {...register('valor_pintura', { 
                  required: 'Valor da pintura é obrigatório',
                  min: { value: 0, message: 'Valor deve ser maior ou igual a 0' }
                })}
                placeholder="450.00"
              />
              {errors.valor_pintura && (
                <p className="text-sm text-destructive">{errors.valor_pintura.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lucro">Lucro *</Label>
              <Input
                id="lucro"
                type="number"
                step="0.01"
                {...register('lucro', { 
                  required: 'Valor do lucro é obrigatório',
                  min: { value: 0, message: 'Valor deve ser maior ou igual a 0' }
                })}
                placeholder="500.00"
              />
              {errors.lucro && (
                <p className="text-sm text-destructive">{errors.lucro.message}</p>
              )}
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Valor Total:</span>
              <span className="font-bold text-2xl text-primary">
                {valorTotal.toLocaleString('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                })}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : itemEditando ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
