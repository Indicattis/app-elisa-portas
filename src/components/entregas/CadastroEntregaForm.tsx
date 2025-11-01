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
import { CreateEntregaData } from '@/hooks/useEntregas';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  nome_cliente: z.string().min(3, 'Nome do cliente deve ter no mínimo 3 caracteres'),
  telefone_cliente: z.string().optional(),
  estado: z.string().min(2, 'Selecione um estado'),
  cidade: z.string().min(2, 'Selecione uma cidade'),
  tamanho: z.string().optional(),
  data_entrega: z.string().optional(),
  data_producao: z.string().optional(),
  status: z.enum(['pendente_producao', 'em_producao', 'em_qualidade', 'aguardando_pintura', 'pronta_fabrica', 'finalizada']).optional(),
  responsavel_entrega_id: z.string().optional(),
});

interface CadastroEntregaFormProps {
  onSubmit: (data: CreateEntregaData) => Promise<void>;
  initialData?: CreateEntregaData;
  isEditing?: boolean;
}

export const CadastroEntregaForm = ({ 
  onSubmit, 
  initialData,
  isEditing = false 
}: CadastroEntregaFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [selectedEstado, setSelectedEstado] = useState(initialData?.estado || '');
  const [cidades, setCidades] = useState<string[]>(
    initialData?.estado ? getCidadesPorEstado(initialData.estado) : []
  );

  const form = useForm<CreateEntregaData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nome_cliente: '',
      telefone_cliente: '',
      estado: '',
      cidade: '',
      tamanho: '',
      data_entrega: undefined,
      data_producao: undefined,
      status: 'pendente_producao',
      responsavel_entrega_id: undefined,
    },
  });

  const handleEstadoChange = (estado: string) => {
    setSelectedEstado(estado);
    const cidadesDoEstado = getCidadesPorEstado(estado);
    setCidades(cidadesDoEstado);
    form.setValue('cidade', '');
  };

  const handleSubmit = async (values: CreateEntregaData) => {
    setSubmitting(true);
    try {
      // Convert empty strings to null for optional fields
      const dataToSubmit = {
        ...values,
        data_entrega: values.data_entrega && values.data_entrega.trim() !== '' 
          ? values.data_entrega 
          : undefined,
        responsavel_entrega_id: values.responsavel_entrega_id && values.responsavel_entrega_id.trim() !== ''
          ? values.responsavel_entrega_id
          : undefined,
      };
      
      await onSubmit(dataToSubmit);
      
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

        <FormField
          control={form.control}
          name="telefone_cliente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="(00) 00000-0000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ESTADOS_BRASIL.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {estado}
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
                  defaultValue={field.value}
                  disabled={!selectedEstado}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
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
                <Input placeholder="Ex: 2.00 x 2.10" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="data_entrega"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Entrega (Opcional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pendente_producao">Pendente Produção</SelectItem>
                  <SelectItem value="em_producao">Em Produção</SelectItem>
                  <SelectItem value="em_qualidade">Em Qualidade</SelectItem>
                  <SelectItem value="aguardando_pintura">Aguardando Pintura</SelectItem>
                  <SelectItem value="pronta_fabrica">Pronta Fábrica</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Atualizar Entrega' : 'Cadastrar Entrega'}
        </Button>
      </form>
    </Form>
  );
};
