import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

const setorOptions = [
  { value: "vendas", label: "Vendas" },
  { value: "marketing", label: "Marketing" },
  { value: "instalacoes", label: "Instalações" },
  { value: "fabrica", label: "Fábrica" },
  { value: "administrativo", label: "Administrativo" },
];

const modalidadeOptions = [
  { value: "mensal", label: "Mensal" },
  { value: "diaria", label: "Diária" },
];

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: z.string().optional(),
  role: z.string().min(1, "Selecione uma função"),
  setor: z.string().min(1, "Selecione um setor"),
  salario: z.string().optional(),
  modalidade_pagamento: z.string().min(1, "Selecione uma modalidade"),
  em_folha: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  return numbers
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatCurrency = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  const amount = parseInt(numbers || "0", 10) / 100;
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const parseCurrency = (value: string): number | null => {
  const numbers = value.replace(/\D/g, "");
  if (!numbers) return null;
  return parseInt(numbers, 10) / 100;
};

export default function NovoColaborador() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  interface RoleOption { key: string; label: string }

  const { data: roles = [] } = useQuery({
    queryKey: ["system-roles-for-novo-colaborador"],
    queryFn: async (): Promise<RoleOption[]> => {
      const result = await (supabase as any)
        .from("system_roles")
        .select("key, label")
        .eq("ativo", true)
        .order("ordem");
      if (result.error) throw result.error;
      return result.data as RoleOption[];
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      password: "mudar123",
      cpf: "",
      role: "",
      setor: "",
      salario: "",
      modalidade_pagamento: "mensal",
      em_folha: true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Usuário não autenticado");
      }

      const salarioValue = parseCurrency(values.salario || "");
      const cpfClean = values.cpf?.replace(/\D/g, "") || null;

      const response = await supabase.functions.invoke("create-user", {
        body: {
          email: values.email,
          password: values.password,
          nome: values.nome,
          role: values.role,
          setor: values.setor,
          salario: salarioValue,
          modalidade_pagamento: values.modalidade_pagamento,
          em_folha: values.em_folha,
          cpf: cpfClean,
          eh_colaborador: true,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao criar colaborador");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "Colaborador criado com sucesso!",
        description: `${values.nome} foi adicionado ao sistema.`,
      });

      navigate("/administrativo/rh-dp/colaboradores");
    } catch (error: any) {
      console.error("Erro ao criar colaborador:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar colaborador",
        description: error.message || "Tente novamente mais tarde.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbItems = [
    { label: "Home", path: "/home" },
    { label: "Administrativo", path: "/administrativo" },
    { label: "RH/DP", path: "/administrativo/rh-dp" },
    { label: "Colaboradores", path: "/administrativo/rh-dp/colaboradores" },
    { label: "Novo Colaborador" },
  ];

  return (
    <MinimalistLayout
      title="Novo Colaborador"
      subtitle="Preencha os dados do novo colaborador"
      backPath="/administrativo/rh-dp/colaboradores"
      breadcrumbItems={breadcrumbItems}
    >
      <div className="max-w-2xl mx-auto">
        <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="p-6 rounded-lg">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-white/80">Nome *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome completo"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                            {...field}
                          />
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
                        <FormLabel className="text-white/80">Email *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email@exemplo.com"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Senha *</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Senha inicial"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-white/40">Senha padrão: mudar123</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">CPF</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="000.000.000-00"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                            {...field}
                            onChange={(e) => field.onChange(formatCPF(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Função *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.key} value={role.key}>
                                {role.label}
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
                    name="setor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Setor *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {setorOptions.map((setor) => (
                              <SelectItem key={setor.value} value={setor.value}>
                                {setor.label}
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
                    name="salario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Salário/Valor</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="R$ 0,00"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                            {...field}
                            onChange={(e) => field.onChange(formatCurrency(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="modalidade_pagamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Modalidade *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {modalidadeOptions.map((mod) => (
                              <SelectItem key={mod.value} value={mod.value}>
                                {mod.label}
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
                    name="em_folha"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-white/80">Em Folha de Pagamento</FormLabel>
                        <div className="flex items-center gap-2 h-10">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <span className="text-sm text-white/60">
                            {field.value ? "Sim" : "Não"}
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/administrativo/rh-dp/colaboradores")}
                    disabled={isSubmitting}
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar Colaborador
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </MinimalistLayout>
  );
}
