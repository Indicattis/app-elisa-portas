import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown, Edit, Save, X, User, Building2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { PedidoPortaObservacoesInsert } from "@/types/pedidoObservacoes";
import {
  OPCOES_TUBO,
  OPCOES_INTERNA_EXTERNA,
  OPCOES_RETIRADA_PORTA,
  OPCOES_POSICAO_GUIA,
  OPCOES_GUIA,
  OPCOES_ROLO,
  OPCOES_TUBO_TIRAS_FRONTAIS,
  OPCOES_LADO_MOTOR,
} from "@/types/pedidoObservacoes";

interface ObservacoesPortaFormProps {
  porta: any;
  portaIndex: number;
  usuarios: Array<{ id: string; nome: string }>;
  autorizados: Array<{ id: string; nome: string }>;
  valoresIniciais?: Partial<PedidoPortaObservacoesInsert>;
  onSalvar: (dados: PedidoPortaObservacoesInsert) => Promise<any>;
  pedidoId: string;
  defaultOpen?: boolean;
  isReadOnly?: boolean;
}

export function ObservacoesPortaForm({
  porta,
  portaIndex,
  usuarios,
  autorizados,
  valoresIniciais,
  onSalvar,
  pedidoId,
  defaultOpen = false,
  isReadOnly = false,
}: ObservacoesPortaFormProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const form = useForm<PedidoPortaObservacoesInsert>({
    defaultValues: {
      pedido_id: pedidoId,
      produto_venda_id: porta.id,
      responsavel_medidas_id: valoresIniciais?.responsavel_medidas_id || null,
      tipo_responsavel: valoresIniciais?.tipo_responsavel || 'admin',
      opcao_tubo: valoresIniciais?.opcao_tubo || 'sem_tubo',
      interna_externa: valoresIniciais?.interna_externa || 'porta_interna',
      retirada_porta: valoresIniciais?.retirada_porta || false,
      posicao_guia: valoresIniciais?.posicao_guia || 'guia_dentro_vao',
      opcao_guia: valoresIniciais?.opcao_guia || 'guia_aparente',
      opcao_rolo: valoresIniciais?.opcao_rolo || 'nao_erguer',
      tubo_tiras_frontais: valoresIniciais?.tubo_tiras_frontais || 'sem_tubo_tiras_frontais',
      lado_motor: valoresIniciais?.lado_motor || 'esquerdo',
    },
  });

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      await onSalvar(form.getValues() as PedidoPortaObservacoesInsert);
      setModoEdicao(false);
    } finally {
      setSalvando(false);
    }
  };

  const handleCancelar = () => {
    form.reset({
      pedido_id: pedidoId,
      produto_venda_id: porta.id,
      responsavel_medidas_id: valoresIniciais?.responsavel_medidas_id || null,
      tipo_responsavel: valoresIniciais?.tipo_responsavel || 'admin',
      opcao_tubo: valoresIniciais?.opcao_tubo || 'sem_tubo',
      interna_externa: valoresIniciais?.interna_externa || 'porta_interna',
      retirada_porta: valoresIniciais?.retirada_porta || false,
      posicao_guia: valoresIniciais?.posicao_guia || 'guia_dentro_vao',
      opcao_guia: valoresIniciais?.opcao_guia || 'guia_aparente',
      opcao_rolo: valoresIniciais?.opcao_rolo || 'nao_erguer',
      tubo_tiras_frontais: valoresIniciais?.tubo_tiras_frontais || 'sem_tubo_tiras_frontais',
      lado_motor: valoresIniciais?.lado_motor || 'esquerdo',
    });
    setModoEdicao(false);
  };

  // Resumo das configurações atuais
  const resumo = [
    OPCOES_LADO_MOTOR[form.watch('lado_motor') || 'esquerdo'],
    OPCOES_INTERNA_EXTERNA[form.watch('interna_externa') || 'porta_interna'],
  ].filter(Boolean).join(' • ');

  // Extrair medidas do campo tamanho se largura/altura estiverem vazios
  const getMedidas = () => {
    if (porta.largura && porta.altura) {
      return `${porta.largura}m × ${porta.altura}m`;
    }
    if (porta.tamanho && porta.tamanho.includes('x')) {
      const [largura, altura] = porta.tamanho.split('x');
      return `${largura}m × ${altura}m`;
    }
    return porta.tamanho || 'Medidas não informadas';
  };

  const responsavelPreenchido = !!form.watch('responsavel_medidas_id');

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={`border rounded-lg ${!responsavelPreenchido ? 'border-destructive/50 bg-destructive/5' : ''}`}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors">
          <Badge variant={responsavelPreenchido ? "outline" : "destructive"}>
            <FileText className="h-3 w-3 mr-1" />
            Porta #{portaIndex + 1}
          </Badge>
          <span className="text-sm font-medium">
            {getMedidas()}
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            {resumo}
          </span>
          {!responsavelPreenchido && (
            <Badge variant="outline" className="ml-2 text-[10px] border-destructive text-destructive">
              Pendente
            </Badge>
          )}
          <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="p-4 pt-0 border-t">
          {/* Header com botões */}
          <div className="flex justify-end gap-2 mt-4 mb-4">
            {isReadOnly ? (
              <Badge variant="secondary" className="text-xs">
                Somente leitura
              </Badge>
            ) : !modoEdicao ? (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setModoEdicao(true);
                }}
              >
                <Edit className="w-3 h-3 mr-2" />
                Editar
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelar();
                  }}
                >
                  <X className="w-3 h-3 mr-2" />
                  Cancelar
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSalvar();
                  }}
                  disabled={salvando}
                >
                  <Save className="w-3 h-3 mr-2" />
                  {salvando ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            )}
          </div>

          <Form {...form}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="responsavel_medidas_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Responsável pelas medidas
                      <span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        // Verificar se é admin ou autorizado
                        const isAutorizado = autorizados.some(a => a.id === value);
                        form.setValue('tipo_responsavel', isAutorizado ? 'autorizado' : 'admin');
                        field.onChange(value);
                      }} 
                      value={field.value || undefined}
                      disabled={!modoEdicao}
                    >
                      <FormControl>
                        <SelectTrigger className={`h-9 text-xs ${!field.value && modoEdicao ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel className="text-xs font-semibold text-primary flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Equipe Interna
                          </SelectLabel>
                          {usuarios.map(user => (
                            <SelectItem key={user.id} value={user.id} className="text-xs">
                              {user.nome}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        {autorizados.length > 0 && (
                          <>
                            <SelectSeparator />
                            <SelectGroup>
                              <SelectLabel className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                Autorizados
                              </SelectLabel>
                              {autorizados.map(aut => (
                                <SelectItem key={aut.id} value={aut.id} className="text-xs">
                                  {aut.nome}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    {!field.value && <p className="text-[10px] text-destructive">Obrigatório para avançar o pedido</p>}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lado_motor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Lado do Motor</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!modoEdicao}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(OPCOES_LADO_MOTOR).map(([key, label]) => (
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
                name="opcao_tubo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Opção de tubo</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!modoEdicao}
                    >
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
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!modoEdicao}
                    >
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
                      disabled={!modoEdicao}
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
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!modoEdicao}
                    >
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
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!modoEdicao}
                    >
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
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!modoEdicao}
                    >
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
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!modoEdicao}
                    >
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
      </CollapsibleContent>
    </Collapsible>
  );
}