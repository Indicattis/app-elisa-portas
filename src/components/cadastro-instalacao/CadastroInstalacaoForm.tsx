import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ESTADOS_BRASIL, getCidadesPorEstado } from '@/utils/estadosCidades';
import { CreateInstalacaoData } from '@/hooks/useInstalacoesCadastradas';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  nome_cliente: z.string().min(3, 'Nome do cliente deve ter no mínimo 3 caracteres'),
  estado: z.string().min(2, 'Selecione um estado'),
  cidade: z.string().min(2, 'Selecione uma cidade'),
  tamanho: z.string().optional(),
});

interface CadastroInstalacaoFormProps {
  onSubmit: (data: CreateInstalacaoData) => Promise<void>;
  initialData?: CreateInstalacaoData;
  isEditing?: boolean;
}

export const CadastroInstalacaoForm = ({ 
  onSubmit, 
  initialData,
  isEditing = false 
}: CadastroInstalacaoFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [selectedEstado, setSelectedEstado] = useState(initialData?.estado || '');
  const [cidades, setCidades] = useState<string[]>(
    initialData?.estado ? getCidadesPorEstado(initialData.estado) : []
  );

  const form = useForm<CreateInstalacaoData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nome_cliente: '',
      estado: '',
      cidade: '',
      tamanho: '',
    },
  });

  const handleEstadoChange = (estado: string) => {
    setSelectedEstado(estado);
    const cidadesDoEstado = getCidadesPorEstado(estado);
    setCidades(cidadesDoEstado);
    form.setValue('cidade', '');
  };

  const handleSubmit = async (values: CreateInstalacaoData) => {
    setSubmitting(true);
    try {
      await onSubmit(values);
      if (!isEditing) {
        form.reset();
        setSelectedEstado('');
        setCidades([]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nome_cliente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Cliente</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome do cliente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleEstadoChange(value);
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ESTADOS_BRASIL.map((estado) => (
                      <SelectItem key={estado.sigla} value={estado.sigla}>
                        {estado.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedEstado}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a cidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cidades.map((cidade) => (
                      <SelectItem key={cidade} value={cidade}>
                        {cidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tamanho"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tamanho (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 2.10m x 0.80m" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Atualizar Instalação' : 'Cadastrar Instalação'}
        </Button>
      </form>
    </Form>
  );
};
