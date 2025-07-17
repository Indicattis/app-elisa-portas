import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const cores = [
  'Branco', 'Preto', 'Cinza', 'Azul', 'Verde', 'Vermelho', 
  'Amarelo', 'Laranja', 'Rosa', 'Roxo', 'Marrom', 'Bege',
  'Dourado', 'Prata', 'Bronze'
];

const tiposProduto = [
  'Porta de Enrolar',
  'Kit Porta Social',
  'Porta de Correr',
  'Porta Basculante',
  'Portão Social'
];

const pedidoSchema = z.object({
  numero_pedido: z.string().min(1, 'Número do pedido é obrigatório'),
  cliente_nome: z.string().min(1, 'Nome do cliente é obrigatório'),
  cliente_telefone: z.string().optional(),
  produto_tipo: z.string().min(1, 'Tipo do produto é obrigatório'),
  produto_cor: z.string().min(1, 'Cor do produto é obrigatória'),
  produto_altura: z.string().min(1, 'Altura é obrigatória'),
  produto_largura: z.string().min(1, 'Largura é obrigatória'),
  data_entrega: z.date().optional(),
  observacoes: z.string().optional(),
});

type PedidoFormData = z.infer<typeof pedidoSchema>;

export default function NovoPedido() {
  const navigate = useNavigate();
  
  const form = useForm<PedidoFormData>({
    resolver: zodResolver(pedidoSchema),
    defaultValues: {
      numero_pedido: '',
      cliente_nome: '',
      cliente_telefone: '',
      produto_tipo: '',
      produto_cor: '',
      produto_altura: '',
      produto_largura: '',
      observacoes: '',
    },
  });

  const onSubmit = async (data: PedidoFormData) => {
    try {
      const { error } = await supabase
        .from('pedidos_producao')
        .insert({
          numero_pedido: data.numero_pedido,
          cliente_nome: data.cliente_nome,
          cliente_telefone: data.cliente_telefone || null,
          produto_tipo: data.produto_tipo,
          produto_cor: data.produto_cor,
          produto_altura: data.produto_altura,
          produto_largura: data.produto_largura,
          data_entrega: data.data_entrega?.toISOString().split('T')[0] || null,
          observacoes: data.observacoes || null,
          status: 'pendente',
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Pedido criado com sucesso!',
      });

      navigate('/dashboard/producao');
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar pedido. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard/producao')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Novo Pedido de Produção</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Dados do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numero_pedido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Pedido</FormLabel>
                      <FormControl>
                        <Input placeholder="PED001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cliente_nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="João Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="cliente_telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="produto_tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo do Produto</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tiposProduto.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                              {tipo}
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
                  name="produto_cor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor do Produto</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a cor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cores.map((cor) => (
                            <SelectItem key={cor} value={cor}>
                              {cor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="produto_altura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altura</FormLabel>
                      <FormControl>
                        <Input placeholder="2.20m" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="produto_largura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Largura</FormLabel>
                      <FormControl>
                        <Input placeholder="3.00m" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="data_entrega"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Entrega</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                          locale={ptBR}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observações adicionais..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" className="flex-1">
                  Criar Pedido
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/producao')}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}