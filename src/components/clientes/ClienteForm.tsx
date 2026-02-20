import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCanaisAquisicao } from "@/hooks/useCanaisAquisicao";
import { Cliente, ClienteFormData, useCheckClienteDuplicado } from "@/hooks/useClientes";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertTriangle, Star, Triangle } from "lucide-react";

const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const TIPOS_CLIENTE = [
  { value: 'CE', label: 'CE - Cliente Esporádico' },
  { value: 'CR', label: 'CR - Cliente Recorrente' },
] as const;

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  cpf_cnpj: z.string().optional(),
  estado: z.string().optional(),
  cidade: z.string().optional(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  canal_aquisicao_id: z.string().optional(),
  observacoes: z.string().optional(),
  tipo_cliente: z.enum(['CE', 'CR']).optional(),
  fidelizado: z.boolean().optional(),
  parceiro: z.boolean().optional(),
});

interface ClienteFormProps {
  cliente?: Cliente | null;
  onSubmit: (data: ClienteFormData) => void;
  isLoading?: boolean;
}

export function ClienteForm({ cliente, onSubmit, isLoading }: ClienteFormProps) {
  const { canais } = useCanaisAquisicao();
  const [cpfParaVerificar, setCpfParaVerificar] = useState("");

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: cliente?.nome || "",
      telefone: cliente?.telefone || "",
      email: cliente?.email || "",
      cpf_cnpj: cliente?.cpf_cnpj || "",
      estado: cliente?.estado || "",
      cidade: cliente?.cidade || "",
      cep: cliente?.cep || "",
      endereco: cliente?.endereco || "",
      bairro: cliente?.bairro || "",
      canal_aquisicao_id: cliente?.canal_aquisicao_id || "",
      observacoes: cliente?.observacoes || "",
      tipo_cliente: cliente?.tipo_cliente || undefined,
      fidelizado: cliente?.fidelizado || false,
      parceiro: cliente?.parceiro || false,
    },
  });

  const cpfCnpjValue = form.watch("cpf_cnpj");
  
  // Debounce para verificação de duplicação
  useEffect(() => {
    const timer = setTimeout(() => {
      if (cpfCnpjValue && cpfCnpjValue.replace(/\D/g, '').length >= 11) {
        setCpfParaVerificar(cpfCnpjValue);
      } else {
        setCpfParaVerificar("");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [cpfCnpjValue]);

  const { data: clienteDuplicado, isLoading: verificandoDuplicado } = useCheckClienteDuplicado(cpfParaVerificar);
  
  // Verificar se o duplicado encontrado é o próprio cliente sendo editado
  const isDuplicadoReal = clienteDuplicado && clienteDuplicado.id !== cliente?.id;

  const handleSubmit = (data: ClienteFormData) => {
    // Bloquear submit se houver duplicação
    if (isDuplicadoReal) {
      return;
    }
    
    // Remove campos vazios
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== "" && v !== undefined)
    ) as ClienteFormData;
    onSubmit(cleanData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo *</FormLabel>
              <FormControl>
                <Input placeholder="Nome do cliente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(00) 00000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="cpf_cnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF/CNPJ</FormLabel>
              <FormControl>
                <Input 
                  placeholder="000.000.000-00 ou 00.000.000/0001-00" 
                  {...field} 
                  className={isDuplicadoReal ? "border-destructive" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Alerta de duplicação */}
        {isDuplicadoReal && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>CPF/CNPJ já cadastrado!</strong>
              <br />
              Cliente existente: <strong>{clienteDuplicado.nome}</strong>
              {clienteDuplicado.telefone && ` - Tel: ${clienteDuplicado.telefone}`}
              <br />
              <span className="text-sm">
                Não é possível cadastrar dois clientes com o mesmo CPF/CNPJ.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {verificandoDuplicado && cpfParaVerificar && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verificando CPF/CNPJ...
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ESTADOS_BR.map((uf) => (
                      <SelectItem key={uf} value={uf}>
                        {uf}
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
              <FormItem className="md:col-span-2">
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da cidade" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="cep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl>
                  <Input placeholder="00000-000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bairro"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Bairro</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do bairro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="endereco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input placeholder="Rua, número, complemento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tipo_cliente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Cliente</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIPOS_CLIENTE.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
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
            name="canal_aquisicao_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Canal de Aquisição</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Como conheceu a empresa?" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {canais.map((canal) => (
                      <SelectItem key={canal.id} value={canal.id}>
                        {canal.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center gap-6">
          <FormField
            control={form.control}
            name="fidelizado"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="flex items-center gap-1.5 cursor-pointer font-normal">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  Fidelizado
                </FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parceiro"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="flex items-center gap-1.5 cursor-pointer font-normal">
                  <Triangle className="h-4 w-4 text-purple-500 fill-purple-500" />
                  Parceiro
                </FormLabel>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Informações adicionais sobre o cliente"
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading || isDuplicadoReal || verificandoDuplicado}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {cliente ? "Salvar Alterações" : "Criar Cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
