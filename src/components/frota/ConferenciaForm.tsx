import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

export interface ConferenciaFormData {
  km_atual: number;
  agua_conferida: boolean;
  nivel_oleo_conferido: boolean;
  data_troca_oleo?: string;
  observacoes?: string;
}

interface ConferenciaFormProps {
  fotoPreview: string;
  onSubmit: (data: ConferenciaFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialKmAtual?: number;
}

export function ConferenciaForm({ fotoPreview, onSubmit, onCancel, isSubmitting, initialKmAtual }: ConferenciaFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ConferenciaFormData>({
    defaultValues: {
      km_atual: initialKmAtual || 0,
      agua_conferida: false,
      nivel_oleo_conferido: false,
      data_troca_oleo: '',
      observacoes: ''
    }
  });

  const nivelOleoConferido = watch('nivel_oleo_conferido');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-center">
        <img 
          src={fotoPreview} 
          alt="Foto do veículo" 
          className="max-w-md w-full h-auto rounded-lg border shadow-lg"
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="km_atual">Km Atual *</Label>
          <Input
            id="km_atual"
            type="number"
            step="0.1"
            {...register('km_atual', { 
              required: 'Km atual é obrigatório',
              valueAsNumber: true,
              min: { value: 0, message: 'Km deve ser maior ou igual a 0' }
            })}
            placeholder="Digite a quilometragem atual"
          />
          {errors.km_atual && (
            <p className="text-sm text-destructive">{errors.km_atual.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="agua_conferida"
            checked={watch('agua_conferida')}
            onCheckedChange={(checked) => setValue('agua_conferida', checked as boolean)}
          />
          <Label htmlFor="agua_conferida" className="cursor-pointer">
            Água conferida
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="nivel_oleo_conferido"
            checked={watch('nivel_oleo_conferido')}
            onCheckedChange={(checked) => setValue('nivel_oleo_conferido', checked as boolean)}
          />
          <Label htmlFor="nivel_oleo_conferido" className="cursor-pointer">
            Nível do óleo
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Input
            id="observacoes"
            {...register('observacoes')}
            placeholder="Digite observações sobre a conferência"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Finalizar Conferência
        </Button>
      </div>
    </form>
  );
}
