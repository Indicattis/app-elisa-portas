import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { SETOR_LABELS } from "@/utils/setorMapping";
import { getSetorFromRole } from "@/utils/setorMapping";
import { ROLE_LABELS } from "@/types/permissions";
import { useVagas } from "@/hooks/useVagas";

const modalidadeOptions = [
  { value: "mensal", label: "Mensal" },
  { value: "diaria", label: "Diária" },
];

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: z.string().optional(),
  salario: z.string().optional(),
  modalidade_pagamento: z.string().min(1, "Selecione uma modalidade"),
  em_folha: z.boolean(),
  em_teste: z.boolean(),
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
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const parseCurrency = (value: string): number | null => {
  const numbers = value.replace(/\D/g, "");
  if (!numbers) return null;
  return parseInt(numbers, 10) / 100;
};

export default function PreencherVagaPage() {
  const { vagaId } = useParams<{ vagaId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vagaCargo, setVagaCargo] = useState<string>("");
  const [vagaSetor, setVagaSetor] = useState<string>("");
  const [loadingVaga, setLoadingVaga] = useState(true);
  const { updateVagaStatus } = useVagas();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      password: "mudar123",
      cpf: "",
      salario: "",
      modalidade_pagamento: "mensal",
      em_folha: true,
      em_teste: false,
    },
  });

  useEffect(() => {
    async function fetchVaga() {
      if (!vagaId) return;
      const { data, error } = await supabase
        .from("vagas")
        .select("cargo")
        .eq("id", vagaId)
        .single();

      if (error || !data) {
        toast({ variant: "destructive", title: "Vaga não encontrada" });
        navigate("/administrativo/rh-dp/vagas");
        return;
      }

      const cargo = data.cargo as string;
      setVagaCargo(cargo);
      setVagaSetor(getSetorFromRole(cargo as any) || "");
      setLoadingVaga(false);
    }
    fetchVaga();
  }, [vagaId]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Usuário não autenticado");

      const salarioValue = parseCurrency(values.salario || "");
      const cpfClean = values.cpf?.replace(/\D/g, "") || null;

      const response = await supabase.functions.invoke("create-user", {
        body: {
          email: values.email,
          password: values.password,
          nome: values.nome,
          role: vagaCargo,
          setor: vagaSetor,
          salario: salarioValue,
          modalidade_pagamento: values.modalidade_pagamento,
          em_folha: values.em_folha,
          cpf: cpfClean,
          eh_colaborador: true,
          em_teste: values.em_teste,
        },
      });

      if (response.error) throw new Error(response.error.message || "Erro ao criar colaborador");
      if (response.data?.error) throw new Error(response.data.error);

      // Mark vacancy as filled
      if (vagaId) {
        await updateVagaStatus(vagaId, "preenchida");
      }

      toast({
        title: "Colaborador criado com sucesso!",
        description: `${values.nome} foi adicionado ao sistema.`,
      });

      navigate("/administrativo/rh-dp/vagas");
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

  if (loadingVaga) {
    return (
      <MinimalistLayout title="Preencher Vaga" subtitle="Carregando..." backPath="/administrativo/rh-dp/vagas">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      </MinimalistLayout>
    );
  }

  const roleLabel = ROLE_LABELS[vagaCargo] || vagaCargo;
  const setorLabel = SETOR_LABELS[vagaSetor] || vagaSetor;

  return (
    <MinimalistLayout
      title="Preencher Vaga"
      subtitle={`Cadastro para ${roleLabel} — ${setorLabel}`}
      backPath="/administrativo/rh-dp/vagas"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Administrativo", path: "/administrativo" },
        { label: "RH/DP", path: "/administrativo/rh-dp" },
        { label: "Vagas", path: "/administrativo/rh-dp/vagas" },
        { label: "Preencher Vaga" },
      ]}
    >
      <div className="max-w-2xl mx-auto">
        <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="p-6 rounded-lg">
            {/* Locked role & setor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium text-white/80 mb-1.5 block">Função</label>
                <div className="h-10 px-3 flex items-center rounded-md bg-white/5 border border-white/10 text-white/60 text-sm">
                  {roleLabel}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white/80 mb-1.5 block">Setor</label>
                <div className="h-10 px-3 flex items-center rounded-md bg-white/5 border border-white/10 text-white/60 text-sm">
                  {setorLabel}
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="nome" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-white/80">Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Senha *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Senha inicial" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" {...field} />
                      </FormControl>
                      <p className="text-xs text-white/40">Senha padrão: mudar123</p>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="cpf" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" {...field} onChange={(e) => field.onChange(formatCPF(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="salario" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Salário/Valor</FormLabel>
                      <FormControl>
                        <Input placeholder="R$ 0,00" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" {...field} onChange={(e) => field.onChange(formatCurrency(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="modalidade_pagamento" render={({ field }) => (
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
                            <SelectItem key={mod.value} value={mod.value}>{mod.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="em_folha" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-white/80">Em Folha de Pagamento</FormLabel>
                      <div className="flex items-center gap-2 h-10">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <span className="text-sm text-white/60">{field.value ? "Sim" : "Não"}</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="em_teste" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-white/80">Status de Contratação</FormLabel>
                      <div className="flex items-center gap-2 h-10">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <span className={`text-sm ${field.value ? "text-blue-400" : "text-white/60"}`}>
                          {field.value ? "Em teste" : "Efetivado"}
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/administrativo/rh-dp/vagas")}
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
