import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LEAD_TAGS, getLeadTag, canEditTag } from "@/utils/newLeadSystem";
import type { LeadStatus } from "@/utils/newLeadSystem";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LeadTagSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTagId: number | null;
  leadStatus: LeadStatus;
  onTagChange: (tagId: number | null) => Promise<void>;
  leadName: string;
  leadId?: string;
}

export function LeadTagSelector({ 
  open, 
  onOpenChange, 
  currentTagId, 
  leadStatus,
  onTagChange, 
  leadName,
  leadId 
}: LeadTagSelectorProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Agora todos os usuários podem visualizar e alterar qualquer tag
  const availableTags = LEAD_TAGS;

  const handleTagSelect = async (tagId: number) => {
    if (!leadId) return;
    
    try {
      setLoading(true);
      const currentTag = currentTagId;
      
      // Apenas atualizar a tag agora
      const updateData: any = { tag_id: tagId };
      
      const { error } = await supabase
        .from("elisaportas_leads")
        .update(updateData)
        .eq("id", leadId);

      if (error) throw error;

      // Registrar no histórico de etiquetas
      const { error: historicoError } = await supabase
        .from("lead_etiqueta_historico")
        .insert({
          lead_id: leadId,
          tag_id_anterior: currentTag,
          tag_id_novo: tagId,
          usuario_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (historicoError) {
        console.warn("Erro ao registrar histórico de etiquetas:", historicoError);
      }

      await onTagChange(tagId);
      onOpenChange(false);
      
      toast({
        title: "Sucesso",
        description: tagId === 7 ? "Lead marcado como vendido!" : "Etiqueta atualizada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao alterar tag:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao alterar etiqueta",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async () => {
    if (!leadId) return;
    
    try {
      setLoading(true);
      const currentTag = currentTagId;
      
      const { error } = await supabase
        .from("elisaportas_leads")
        .update({ tag_id: null })
        .eq("id", leadId);

      if (error) throw error;

      // Registrar no histórico de etiquetas
      const { error: historicoError } = await supabase
        .from("lead_etiqueta_historico")
        .insert({
          lead_id: leadId,
          tag_id_anterior: currentTag,
          tag_id_novo: null,
          usuario_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (historicoError) {
        console.warn("Erro ao registrar histórico de etiquetas:", historicoError);
      }

      await onTagChange(null);
      onOpenChange(false);
      
      toast({
        title: "Sucesso",
        description: "Etiqueta removida com sucesso",
      });
    } catch (error) {
      console.error("Erro ao remover tag:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao remover etiqueta",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Alterar Etiqueta do Lead</DialogTitle>
          <DialogDescription>
            Selecione uma nova etiqueta para o lead <strong>{leadName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {currentTagId && (
                <div className="mb-3">
                  <span>Etiqueta atual: </span>
                  <Badge className={getLeadTag(currentTagId)?.color}>
                    {getLeadTag(currentTagId)?.name}
                  </Badge>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              {availableTags.map((tag) => (
                <Button
                  key={tag.id}
                  variant="outline"
                  className="justify-start h-auto p-3"
                  onClick={() => handleTagSelect(tag.id)}
                  disabled={loading || currentTagId === tag.id}
                >
                  <div className="flex items-center gap-3">
                    <Badge className={tag.color}>
                      {tag.name}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {tag.description}
                    </span>
                  </div>
                </Button>
              ))}
            </div>

            {currentTagId && (
              <div className="pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={handleRemoveTag}
                  disabled={loading}
                  className="w-full"
                >
                  Remover Etiqueta
                </Button>
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}