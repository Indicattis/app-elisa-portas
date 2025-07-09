import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MOTIVO_PERDA_CONFIG } from "@/utils/newLeadSystem";
import type { MotivoPerda } from "@/utils/newLeadSystem";

const lossSchema = z.object({
  motivo_perda: z.enum(["desqualificado", "perdido_por_preco", "perdido_por_prazo", "outro"], {
    required_error: "Selecione um motivo",
  }),
  observacoes_perda: z.string().optional(),
});

type LossFormData = z.infer<typeof lossSchema>;

interface LeadLossModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { motivo_perda: MotivoPerda; observacoes_perda?: string }) => Promise<void>;
  leadName: string;
}

export function LeadLossModal({ open, onOpenChange, onConfirm, leadName }: LeadLossModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<LossFormData>({
    resolver: zodResolver(lossSchema),
  });

  const handleSubmit = async (data: LossFormData) => {
    try {
      setLoading(true);
      await onConfirm({
        motivo_perda: data.motivo_perda,
        observacoes_perda: data.observacoes_perda,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao marcar lead como perdido:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Marcar Lead como Perdido</DialogTitle>
          <DialogDescription>
            Você está marcando o lead <strong>{leadName}</strong> como perdido.
            Por favor, informe o motivo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="motivo_perda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo da Perda</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o motivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(MOTIVO_PERDA_CONFIG).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
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
              name="observacoes_perda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva detalhes sobre a perda do lead..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={loading}>
                {loading ? "Salvando..." : "Confirmar Perda"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}