import { useState, useEffect } from 'react';
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
import { useEquipesInstalacao } from '@/hooks/useEquipesInstalacao';
import { useAutorizadosAptos } from '@/hooks/useAutorizadosAptos';

const formSchema = z.object({
  nome_cliente: z.string().min(3, 'Nome do cliente deve ter no mínimo 3 caracteres'),
  data_instalacao: z.string().optional(),
  status: z.enum(['pendente_producao', 'pronta_fabrica', 'finalizada']).optional(),
  tipo_instalacao: z.string().optional(),
  responsavel_instalacao_id: z.string().optional(),
  venda_id: z.string().optional(),
  pedido_id: z.string().optional(),
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
  const [selectedTipoInstalacao, setSelectedTipoInstalacao] = useState<string>(initialData?.tipo_instalacao || '');
  
  const { equipes, loading: loadingEquipes } = useEquipesInstalacao();
  const { autorizados, loading: loadingAutorizados } = useAutorizadosAptos();

  const form = useForm<CreateInstalacaoData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nome_cliente: '',
      data_instalacao: undefined,
      status: 'pendente_producao',
      tipo_instalacao: undefined,
      responsavel_instalacao_id: undefined,
    },
  });

  const handleSubmit = async (values: CreateInstalacaoData) => {
    setSubmitting(true);
    try {
      // Get responsavel name based on tipo_instalacao
      let responsavel_instalacao_nome = undefined;
      if (values.tipo_instalacao && values.responsavel_instalacao_id) {
        if (values.tipo_instalacao === 'elisa') {
          const equipe = equipes.find(e => e.id === values.responsavel_instalacao_id);
          responsavel_instalacao_nome = equipe?.nome;
        } else {
          const autorizado = autorizados.find(a => a.id === values.responsavel_instalacao_id);
          responsavel_instalacao_nome = autorizado?.nome;
        }
      }
      
      // Convert empty strings to null for optional fields
      const dataToSubmit = {
        ...values,
        responsavel_instalacao_nome,
        data_instalacao: values.data_instalacao && values.data_instalacao.trim() !== '' 
          ? values.data_instalacao 
          : null,
        tipo_instalacao: values.tipo_instalacao && values.tipo_instalacao.trim() !== ''
          ? values.tipo_instalacao as 'elisa' | 'autorizados'
          : undefined,
        responsavel_instalacao_id: values.responsavel_instalacao_id && values.responsavel_instalacao_id.trim() !== ''
          ? values.responsavel_instalacao_id
          : undefined,
      };
      
      await onSubmit(dataToSubmit);
      
      if (!isEditing) {
        form.reset();
        setSelectedTipoInstalacao('');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  useEffect(() => {
    if (initialData?.tipo_instalacao) {
      setSelectedTipoInstalacao(initialData.tipo_instalacao);
    }
  }, [initialData]);

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
          name="data_instalacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data da Instalação (Opcional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value || ''} />
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pendente_producao">Pendente Produção</SelectItem>
                  <SelectItem value="pronta_fabrica">Pronta Fábrica</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo_instalacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Instalação (Opcional)</FormLabel>
              <Select
                onValueChange={(value) => {
                  const actualValue = value === 'not_defined' ? '' : value;
                  field.onChange(actualValue);
                  setSelectedTipoInstalacao(actualValue);
                  form.setValue('responsavel_instalacao_id', undefined);
                }}
                value={field.value || 'not_defined'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Ainda não definido" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="not_defined">Ainda não definido</SelectItem>
                  <SelectItem value="elisa">Instalação Elisa</SelectItem>
                  <SelectItem value="autorizados">Autorizados</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedTipoInstalacao && (
          <FormField
            control={form.control}
            name="responsavel_instalacao_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {selectedTipoInstalacao === 'elisa' ? 'Equipe de Instalação' : 'Autorizado Responsável'}
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={
                    (selectedTipoInstalacao === 'elisa' && loadingEquipes) ||
                    (selectedTipoInstalacao === 'autorizados' && loadingAutorizados)
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        selectedTipoInstalacao === 'elisa' 
                          ? "Selecione a equipe" 
                          : "Selecione o autorizado"
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {selectedTipoInstalacao === 'elisa' ? (
                      equipes.map((equipe) => (
                        <SelectItem key={equipe.id} value={equipe.id}>
                          {equipe.nome}
                        </SelectItem>
                      ))
                    ) : (
                      autorizados.map((autorizado) => (
                        <SelectItem key={autorizado.id} value={autorizado.id}>
                          {autorizado.nome} - {autorizado.cidade}/{autorizado.estado}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Atualizar Instalação' : 'Cadastrar Instalação'}
        </Button>
      </form>
    </Form>
  );
};
