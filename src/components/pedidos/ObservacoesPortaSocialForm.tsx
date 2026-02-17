import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DoorOpen, ChevronDown, Edit, Save, X } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { PedidoPortaSocialObservacoesInsert } from "@/types/pedidoPortaSocialObservacoes";
import {
  OPCOES_LADO_FECHADURA,
  OPCOES_LADO_ABERTURA,
  OPCOES_ACABAMENTO,
} from "@/types/pedidoPortaSocialObservacoes";

interface ObservacoesPortaSocialFormProps {
  porta: any;
  portaIndex: number;
  valoresIniciais?: Partial<PedidoPortaSocialObservacoesInsert>;
  onSalvar: (dados: PedidoPortaSocialObservacoesInsert) => Promise<any>;
  pedidoId: string;
  defaultOpen?: boolean;
  isReadOnly?: boolean;
}

export function ObservacoesPortaSocialForm({
  porta,
  portaIndex,
  valoresIniciais,
  onSalvar,
  pedidoId,
  defaultOpen = false,
  isReadOnly = false,
}: ObservacoesPortaSocialFormProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const form = useForm<PedidoPortaSocialObservacoesInsert>({
    defaultValues: {
      pedido_id: pedidoId,
      produto_venda_id: porta._originalId || porta.id,
      indice_porta: porta._indicePorta ?? 0,
      altura_menor_porta: valoresIniciais?.altura_menor_porta ?? null,
      espessura_parede: valoresIniciais?.espessura_parede ?? null,
      largura_menor_porta: valoresIniciais?.largura_menor_porta ?? null,
      tem_painel: valoresIniciais?.tem_painel ?? false,
      largura_painel: valoresIniciais?.largura_painel ?? null,
      altura_painel: valoresIniciais?.altura_painel ?? null,
      lado_fechadura: valoresIniciais?.lado_fechadura ?? null,
      lado_abertura: valoresIniciais?.lado_abertura ?? null,
      acabamento: valoresIniciais?.acabamento ?? null,
    },
  });

  const temPainel = form.watch('tem_painel');

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      await onSalvar(form.getValues() as PedidoPortaSocialObservacoesInsert);
      setModoEdicao(false);
    } finally {
      setSalvando(false);
    }
  };

  const handleCancelar = () => {
    form.reset({
      pedido_id: pedidoId,
      produto_venda_id: porta._originalId || porta.id,
      indice_porta: porta._indicePorta ?? 0,
      altura_menor_porta: valoresIniciais?.altura_menor_porta ?? null,
      espessura_parede: valoresIniciais?.espessura_parede ?? null,
      largura_menor_porta: valoresIniciais?.largura_menor_porta ?? null,
      tem_painel: valoresIniciais?.tem_painel ?? false,
      largura_painel: valoresIniciais?.largura_painel ?? null,
      altura_painel: valoresIniciais?.altura_painel ?? null,
      lado_fechadura: valoresIniciais?.lado_fechadura ?? null,
      lado_abertura: valoresIniciais?.lado_abertura ?? null,
      acabamento: valoresIniciais?.acabamento ?? null,
    });
    setModoEdicao(false);
  };

  // Resumo das configurações atuais
  const resumo = [
    form.watch('lado_fechadura') ? OPCOES_LADO_FECHADURA[form.watch('lado_fechadura')!] : null,
    form.watch('lado_abertura') ? OPCOES_LADO_ABERTURA[form.watch('lado_abertura')!] : null,
    form.watch('acabamento') ? OPCOES_ACABAMENTO[form.watch('acabamento')!] : null,
  ].filter(Boolean).join(' • ');

  // Extrair medidas do campo tamanho se largura/altura estiverem vazios
  const getMedidas = () => {
    if (porta.largura && porta.altura) {
      return `${Number(porta.largura).toFixed(2)}m × ${Number(porta.altura).toFixed(2)}m`;
    }
    if (porta.tamanho && porta.tamanho.includes('x')) {
      const [largura, altura] = porta.tamanho.split('x');
      return `${Number(largura).toFixed(2)}m × ${Number(altura).toFixed(2)}m`;
    }
    return porta.tamanho || 'Medidas não informadas';
  };

  const temDadosPreenchidos = !!(form.watch('altura_menor_porta') || form.watch('lado_fechadura'));

  // Label da porta considerando se é expandida
  const portaLabel = porta._totalNoGrupo && porta._totalNoGrupo > 1
    ? `Porta #${portaIndex + 1} (${porta._indicePorta + 1}/${porta._totalNoGrupo})`
    : `Porta #${portaIndex + 1}`;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={`border rounded-lg ${!temDadosPreenchidos ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors">
          <Badge variant={temDadosPreenchidos ? "outline" : "secondary"}>
            <DoorOpen className="h-3 w-3 mr-1" />
            {portaLabel}
          </Badge>
          <span className="text-sm font-medium">
            {getMedidas()}
          </span>
          {resumo && (
            <span className="text-xs text-muted-foreground ml-2">
              {resumo}
            </span>
          )}
          {!temDadosPreenchidos && (
            <Badge variant="outline" className="ml-2 text-[10px] border-amber-500 text-amber-600">
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
              {/* Altura menor da porta */}
              <FormField
                control={form.control}
                name="altura_menor_porta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Altura menor da porta (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 210"
                        disabled={!modoEdicao}
                        className="h-9 text-xs"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Espessura da parede */}
              <FormField
                control={form.control}
                name="espessura_parede"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Espessura da parede (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 15"
                        disabled={!modoEdicao}
                        className="h-9 text-xs"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Largura menor da porta */}
              <FormField
                control={form.control}
                name="largura_menor_porta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Largura menor da porta (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 90"
                        disabled={!modoEdicao}
                        className="h-9 text-xs"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tem painel */}
              <FormField
                control={form.control}
                name="tem_painel"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 pt-5">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!modoEdicao}
                      />
                    </FormControl>
                    <FormLabel className="text-xs !mt-0 cursor-pointer">Tem painel?</FormLabel>
                  </FormItem>
                )}
              />

              {/* Largura painel - só aparece se tem_painel */}
              {temPainel && (
                <FormField
                  control={form.control}
                  name="largura_painel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Largura painel (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 40"
                          disabled={!modoEdicao}
                          className="h-9 text-xs"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Altura painel - só aparece se tem_painel */}
              {temPainel && (
                <FormField
                  control={form.control}
                  name="altura_painel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Altura painel (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 60"
                          disabled={!modoEdicao}
                          className="h-9 text-xs"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Lado da fechadura */}
              <FormField
                control={form.control}
                name="lado_fechadura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Lado da fechadura</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || undefined}
                      disabled={!modoEdicao}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(OPCOES_LADO_FECHADURA).map(([key, label]) => (
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

              {/* Lado de abertura */}
              <FormField
                control={form.control}
                name="lado_abertura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Lado de abertura</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || undefined}
                      disabled={!modoEdicao}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(OPCOES_LADO_ABERTURA).map(([key, label]) => (
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

              {/* Acabamento */}
              <FormField
                control={form.control}
                name="acabamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Acabamento</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || undefined}
                      disabled={!modoEdicao}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(OPCOES_ACABAMENTO).map(([key, label]) => (
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
