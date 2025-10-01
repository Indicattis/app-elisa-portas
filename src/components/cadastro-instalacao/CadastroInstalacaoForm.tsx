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
  estado: z.string().min(2, 'Selecione um estado'),
  cidade: z.string().min(2, 'Selecione uma cidade'),
  tamanho: z.string().optional(),
  categoria: z.enum(['instalacao', 'entrega', 'correcao'], {
    required_error: 'Selecione uma categoria',
  }),
  data_instalacao: z.string().optional(),
  status: z.enum(['pendente_producao', 'pronta_fabrica', 'finalizada']).optional(),
  tipo_instalacao: z.enum(['elisa', 'autorizados']).optional(),
  responsavel_instalacao_id: z.string().optional(),
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
  const [selectedTipoInstalacao, setSelectedTipoInstalacao] = useState<string>(initialData?.tipo_instalacao || '');
  
  const { equipes, loading: loadingEquipes } = useEquipesInstalacao();
  const { autorizados, loading: loadingAutorizados } = useAutorizadosAptos();

  const form = useForm<CreateInstalacaoData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nome_cliente: '',
      estado: '',
      cidade: '',
      tamanho: '',
      categoria: 'instalacao',
      data_instalacao: undefined,
      status: 'pendente_producao',
      tipo_instalacao: undefined,
      responsavel_instalacao_id: '',
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
      
      // Convert empty string to null for date field
      const dataToSubmit = {
        ...values,
        responsavel_instalacao_nome,
        data_instalacao: values.data_instalacao && values.data_instalacao.trim() !== '' 
          ? values.data_instalacao 
          : null,
      };
      
      await onSubmit(dataToSubmit);
      
      if (!isEditing) {
        form.reset();
        setSelectedEstado('');
        setCidades([]);
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
          name="categoria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="instalacao">Instalação</SelectItem>
                  <SelectItem value="entrega">Entrega</SelectItem>
                  <SelectItem value="correcao">Correção</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="data_instalacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da Instalação (Opcional)</FormLabel>
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
        </div>

        <FormField
          control={form.control}
          name="tipo_instalacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Instalação</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedTipoInstalacao(value);
                  form.setValue('responsavel_instalacao_id', '');
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
