import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import type { PedidoPortaObservacoesInsert } from "@/types/pedidoObservacoes";
import {
  OPCOES_TUBO,
  OPCOES_INTERNA_EXTERNA,
  OPCOES_RETIRADA_PORTA,
  OPCOES_POSICAO_GUIA,
  OPCOES_GUIA,
  OPCOES_ROLO,
  OPCOES_TUBO_TIRAS_FRONTAIS,
} from "@/types/pedidoObservacoes";

interface ObservacoesPortaFormProps {
  porta: any;
  portaIndex: number;
  usuarios: Array<{ id: string; nome: string }>;
  valoresIniciais?: Partial<PedidoPortaObservacoesInsert>;
  onSalvar: (dados: PedidoPortaObservacoesInsert) => Promise<any>;
  pedidoId: string;
}

export function ObservacoesPortaForm({
  porta,
  portaIndex,
  usuarios,
  valoresIniciais,
  onSalvar,
  pedidoId,
}: ObservacoesPortaFormProps) {
  const form = useForm<PedidoPortaObservacoesInsert>({
    defaultValues: {
      pedido_id: pedidoId,
      produto_venda_id: porta.id,
      responsavel_medidas_id: valoresIniciais?.responsavel_medidas_id || null,
      opcao_tubo: valoresIniciais?.opcao_tubo || 'sem_tubo',
      interna_externa: valoresIniciais?.interna_externa || 'porta_interna',
      retirada_porta: valoresIniciais?.retirada_porta || false,
      posicao_guia: valoresIniciais?.posicao_guia || 'guia_dentro_vao',
      opcao_guia: valoresIniciais?.opcao_guia || 'guia_aparente',
      opcao_rolo: valoresIniciais?.opcao_rolo || 'nao_erguer',
      tubo_tiras_frontais: valoresIniciais?.tubo_tiras_frontais || 'sem_tubo_tiras_frontais',
    },
  });

  useEffect(() => {
    const subscription = form.watch((value) => {
      const timer = setTimeout(() => {
        onSalvar(value as PedidoPortaObservacoesInsert);
      }, 1000);

      return () => clearTimeout(timer);
    });

    return () => subscription.unsubscribe();
  }, [form, onSalvar]);

  return (
    <div className="border-l-4 border-amber-500 pl-3">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Badge variant="outline" className="bg-amber-50">
          <FileText className="h-3 w-3 mr-1" />
          Porta #{portaIndex + 1}
        </Badge>
        <span className="text-sm font-medium">
          {porta.largura}m × {porta.altura}m
        </span>
      </div>

      <Form {...form}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="responsavel_medidas_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Responsável pelas medidas</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {usuarios.map(user => (
                      <SelectItem key={user.id} value={user.id} className="text-xs">
                        {user.nome}
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
            name="opcao_tubo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Opção de tubo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(OPCOES_TUBO).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {label}
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
            name="interna_externa"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Interna ou externa</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(OPCOES_INTERNA_EXTERNA).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {label}
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
            name="retirada_porta"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Retirada de porta</FormLabel>
                <Select 
                  onValueChange={(v) => field.onChange(v === 'true')} 
                  value={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(OPCOES_RETIRADA_PORTA).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {label}
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
            name="posicao_guia"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Posição do guia</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(OPCOES_POSICAO_GUIA).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {label}
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
            name="opcao_guia"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Opção do guia</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(OPCOES_GUIA).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {label}
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
            name="opcao_rolo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Opção do rolo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(OPCOES_ROLO).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {label}
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
            name="tubo_tiras_frontais"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Tubo para tiras frontais</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(OPCOES_TUBO_TIRAS_FRONTAIS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </div>
  );
}
