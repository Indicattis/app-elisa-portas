import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
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

interface PreencherVagaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRole: string;
  onSuccess: () => void;
  emTeste?: boolean;
  defaultSetor?: string;
}

export function PreencherVagaDialog({ open, onOpenChange, defaultRole, onSuccess, emTeste, defaultSetor }: PreencherVagaDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: roles = [] } = useQuery({
    queryKey: ["system-roles-preencher"],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("system_roles")
        .select("key, label")
        .eq("ativo", true)
        .order("ordem");
      if (result.error) throw result.error;
      return result.data as { key: string; label: string }[];
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "", email: "", password: "mudar123", cpf: "",
      role: "", setor: "", salario: "", modalidade_pagamento: "mensal", em_folha: true,
    },
  });

  // Set default role/setor when dialog opens
  useEffect(() => {
    if (open) {
      if (defaultRole) form.setValue("role", defaultRole);
      if (defaultSetor) form.setValue("setor", defaultSetor);
    }
    if (!open) {
      form.reset();
    }
  }, [open, defaultRole, defaultSetor]);

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

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Usuário não autenticado");

      const response = await supabase.functions.invoke("create-user", {
        body: {
          email: values.email,
          password: values.password,
          nome: values.nome,
          role: values.role,
          setor: values.setor,
          salario: parseCurrency(values.salario || ""),
          modalidade_pagamento: values.modalidade_pagamento,
          em_folha: values.em_folha,
          cpf: values.cpf?.replace(/\D/g, "") || null,
          eh_colaborador: true,
        },
      });

      if (response.error) throw new Error(response.error.message || "Erro ao criar colaborador");
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: "Colaborador criado!", description: `${values.nome} foi adicionado e a vaga preenchida.` });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message || "Erro ao criar colaborador" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preencher Vaga</DialogTitle>
          <DialogDescription>Cadastre o novo colaborador para preencher esta vaga.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem><FormLabel>Nome *</FormLabel><FormControl><Input placeholder="Nome completo" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem><FormLabel>Senha *</FormLabel><FormControl><Input type="password" placeholder="Senha inicial" {...field} /></FormControl>
                <p className="text-xs text-muted-foreground">Senha padrão: mudar123</p><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="cpf" render={({ field }) => (
              <FormItem><FormLabel>CPF</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} onChange={(e) => field.onChange(formatCPF(e.target.value))} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem><FormLabel>Função *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>{roles.map((r) => (<SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>))}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="setor" render={({ field }) => (
                <FormItem><FormLabel>Setor *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>{setorOptions.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="salario" render={({ field }) => (
              <FormItem><FormLabel>Salário/Valor</FormLabel><FormControl><Input placeholder="R$ 0,00" {...field} onChange={(e) => field.onChange(formatCurrency(e.target.value))} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="modalidade_pagamento" render={({ field }) => (
                <FormItem><FormLabel>Modalidade *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>{modalidadeOptions.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="em_folha" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Em Folha</FormLabel>
                  <div className="flex items-center gap-2 h-10">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <span className="text-sm text-muted-foreground">{field.value ? "Sim" : "Não"}</span>
                  </div><FormMessage /></FormItem>
              )} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar e Preencher Vaga
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
