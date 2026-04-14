import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useVagas, type Vaga } from "@/hooks/useVagas";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Briefcase, Check } from "lucide-react";
import { ROLE_LABELS } from "@/types/permissions";
import type { User } from "@/hooks/useAllUsers";

interface TransferirParaVagaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  systemRoles: { key: string; label: string }[];
}

export function TransferirParaVagaDialog({
  open, onOpenChange, user, systemRoles,
}: TransferirParaVagaDialogProps) {
  const [selectedVagaId, setSelectedVagaId] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);
  const { vagas, updateVagaStatus } = useVagas();
  const queryClient = useQueryClient();

  const openVagas = (vagas || []).filter(v => v.status === "aberta" || v.status === "em_analise");

  const getRoleLabel = (key: string) =>
    systemRoles.find(r => r.key === key)?.label || (ROLE_LABELS as any)[key] || key;

  const handleTransfer = async () => {
    if (!user || !selectedVagaId) return;
    const vaga = openVagas.find(v => v.id === selectedVagaId);
    if (!vaga) return;

    setTransferring(true);
    try {
      // Update user: set em_teste=false and role to match vacancy
      const { error } = await supabase
        .from("admin_users")
        .update({ em_teste: false, role: vaga.cargo } as any)
        .eq("id", user.id);

      if (error) throw error;

      // Mark vacancy as filled
      await updateVagaStatus(vaga.id, "preenchida", user.id);

      toast.success(`${user.nome} foi transferido para a vaga de ${getRoleLabel(vaga.cargo)}`);
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      onOpenChange(false);
      setSelectedVagaId(null);
    } catch (err: any) {
      toast.error("Erro ao transferir usuário para a vaga");
      console.error(err);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setSelectedVagaId(null); }}>
      <DialogContent className="sm:max-w-[480px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Transferir para Vaga</DialogTitle>
          <DialogDescription>
            Selecione uma vaga aberta para transferir <strong>{user?.nome}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0 max-h-[350px]">
          {openVagas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma vaga aberta disponível.
            </p>
          ) : (
            openVagas.map(vaga => (
              <div
                key={vaga.id}
                onClick={() => setSelectedVagaId(vaga.id)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                  selectedVagaId === vaga.id
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-transparent hover:bg-accent/50"
                }`}
              >
                <div className="h-9 w-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                  {selectedVagaId === vaga.id ? (
                    <Check className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Briefcase className="w-4 h-4 text-amber-500/70" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{getRoleLabel(vaga.cargo)}</p>
                  <p className="text-xs text-muted-foreground truncate">{vaga.justificativa}</p>
                </div>
                <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 shrink-0">
                  {vaga.status === "aberta" ? "Aberta" : "Em análise"}
                </Badge>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleTransfer}
            disabled={transferring || !selectedVagaId}
          >
            {transferring && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
