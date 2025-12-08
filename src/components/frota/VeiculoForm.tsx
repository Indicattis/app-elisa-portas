import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Loader2 } from "lucide-react";
import { VeiculoFormData } from "@/hooks/useVeiculos";

interface VeiculoFormProps {
  onSubmit: (data: VeiculoFormData & { foto?: File }) => Promise<void>;
  initialData?: Partial<VeiculoFormData>;
  isSubmitting?: boolean;
  isEditing?: boolean;
}

export function VeiculoForm({ onSubmit, initialData, isSubmitting, isEditing = false }: VeiculoFormProps) {
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(initialData?.foto_url || null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<VeiculoFormData>({
    defaultValues: {
      nome: initialData?.nome || '',
      placa: (initialData as any)?.placa || '',
      modelo: initialData?.modelo || '',
      ano: initialData?.ano || new Date().getFullYear(),
      km_atual: initialData?.km_atual || 0,
      data_troca_oleo: initialData?.data_troca_oleo || '',
      km_proxima_troca_oleo: (initialData as any)?.km_proxima_troca_oleo || undefined,
      data_proxima_troca_oleo: (initialData as any)?.data_proxima_troca_oleo || '',
      status: initialData?.status || 'pronto'
    }
  });

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onFormSubmit = async (data: VeiculoFormData) => {
    await onSubmit({ ...data, foto: fotoFile || undefined });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Foto do Veículo</Label>
        <div className="flex items-center gap-4">
          {fotoPreview && (
            <img 
              src={fotoPreview} 
              alt="Preview" 
              className="w-24 h-24 object-cover rounded-lg border"
            />
          )}
          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              className="hidden"
              id="foto-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('foto-upload')?.click()}
            >
              <Camera className="h-4 w-4 mr-2" />
              {fotoPreview ? 'Trocar Foto' : 'Adicionar Foto'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Veículo *</Label>
          <Input
            id="nome"
            {...register('nome', { required: 'Nome é obrigatório' })}
            placeholder="Ex: Caminhão Azul"
          />
          {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="placa">Placa</Label>
          <Input
            id="placa"
            {...register('placa')}
            placeholder="Ex: ABC-1234"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="modelo">Modelo *</Label>
          <Input
            id="modelo"
            {...register('modelo', { required: 'Modelo é obrigatório' })}
            placeholder="Ex: Ford Cargo 1319"
          />
          {errors.modelo && <p className="text-sm text-destructive">{errors.modelo.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ano">Ano *</Label>
          <Input
            id="ano"
            type="number"
            {...register('ano', { 
              required: 'Ano é obrigatório',
              valueAsNumber: true,
              min: { value: 1900, message: 'Ano inválido' },
              max: { value: new Date().getFullYear() + 1, message: 'Ano inválido' }
            })}
          />
          {errors.ano && <p className="text-sm text-destructive">{errors.ano.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="km_atual">Km Atual {!isEditing && '*'}</Label>
          <Input
            id="km_atual"
            type="number"
            step="0.1"
            disabled={isEditing}
            className={isEditing ? "bg-muted" : ""}
            {...register('km_atual', { 
              required: !isEditing ? 'Km atual é obrigatório' : false,
              valueAsNumber: true,
              min: { value: 0, message: 'Km deve ser maior ou igual a 0' }
            })}
          />
          {errors.km_atual && <p className="text-sm text-destructive">{errors.km_atual.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_troca_oleo">Data da Última Troca de Óleo</Label>
          <Input
            id="data_troca_oleo"
            type="date"
            disabled={isEditing}
            className={isEditing ? "bg-muted" : ""}
            {...register('data_troca_oleo')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="km_proxima_troca_oleo">KM Próxima Troca de Óleo</Label>
          <Input
            id="km_proxima_troca_oleo"
            type="number"
            step="1"
            disabled={isEditing}
            className={isEditing ? "bg-muted" : ""}
            {...register('km_proxima_troca_oleo', { valueAsNumber: true })}
            placeholder="Ex: 150000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_proxima_troca_oleo">Data Próxima Troca de Óleo</Label>
          <Input
            id="data_proxima_troca_oleo"
            type="date"
            disabled={isEditing}
            className={isEditing ? "bg-muted" : ""}
            {...register('data_proxima_troca_oleo')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status {!isEditing && '*'}</Label>
          <Select
            value={watch('status')}
            onValueChange={(value) => setValue('status', value as any)}
            disabled={isEditing}
          >
            <SelectTrigger className={isEditing ? "bg-muted" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pronto">Pronto</SelectItem>
              <SelectItem value="atencao">Atenção</SelectItem>
              <SelectItem value="critico">Crítico</SelectItem>
              <SelectItem value="mecanico">Mecânico</SelectItem>
              <SelectItem value="em_uso">Em Uso</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Salvar Veículo
        </Button>
      </div>
    </form>
  );
}
