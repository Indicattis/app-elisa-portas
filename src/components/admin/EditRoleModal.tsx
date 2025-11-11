import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { SETOR_LABELS } from "@/utils/setorMapping";

const roleSchema = z.object({
  label: z
    .string()
    .trim()
    .min(3, "O nome deve ter no mínimo 3 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres"),
  setor: z.string().optional(),
  descricao: z.string().trim().max(500, "A descrição deve ter no máximo 500 caracteres").optional(),
  ordem: z.number().int().min(0).default(0),
  ativo: z.boolean().default(true),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface SystemRole {
  id: string;
  key: string;
  label: string;
  setor: string | null;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
}

interface EditRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: SystemRole | null;
}

export function EditRoleModal({ open, onOpenChange, role }: EditRoleModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      label: "",
      setor: undefined,
      descricao: "",
      ordem: 0,
      ativo: true,
    },
  });

  // Atualizar form quando role mudar
  useEffect(() => {
    if (role) {
      form.reset({
        label: role.label,
        setor: role.setor || undefined,
        descricao: role.descricao || "",
        ordem: role.ordem,
        ativo: role.ativo,
      });
    }
  }, [role, form]);

  const updateRoleMutation = useMutation({
    mutationFn: async (data: RoleFormData) => {
      if (!role) throw new Error("Role não encontrado");

      const { data: result, error } = await supabase
        .from("system_roles")
        .update({
          label: data.label,
          setor: data.setor || null,
          descricao: data.descricao || null,
          ordem: data.ordem,
          ativo: data.ativo,
        })
        .eq("id", role.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-roles"] });
      queryClient.invalidateQueries({ queryKey: ["role-stats"] });
      toast.success("Cargo atualizado com sucesso!");
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar cargo:", error);
      toast.error("Erro ao atualizar cargo: " + error.message);
    },
  });

  const onSubmit = async (data: RoleFormData) => {
    setIsSubmitting(true);
    try {
      await updateRoleMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cargo</DialogTitle>
          <DialogDescription>
            Atualize as informações do cargo. A chave não pode ser alterada.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Mostrar chave como read-only */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Chave do Cargo</label>
              <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                <code>{role?.key}</code>
              </div>
              <p className="text-sm text-muted-foreground">
                A chave não pode ser alterada após a criação do cargo.
              </p>
            </div>

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cargo *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex: Analista de Vendas"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Nome amigável que será exibido na interface do usuário.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="setor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Setor</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um setor (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(SETOR_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Setor ao qual este cargo pertence (opcional).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição das responsabilidades deste cargo..."
                      {...field}
                      disabled={isSubmitting}
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    Descrição opcional das responsabilidades e atribuições do cargo.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ordem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem de Exibição</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Ordem de exibição do cargo nas listas (menor número aparece primeiro).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Cargo Ativo</FormLabel>
                    <FormDescription>
                      Desative para impedir que novos usuários sejam atribuídos a este cargo.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
