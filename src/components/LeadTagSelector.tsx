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
  
  const canEdit = canEditTag(leadStatus);
  const availableTags = LEAD_TAGS.filter(tag => 
    // Tags 1-7 podem ser selecionadas livremente quando status é 1 ou 2 (incluindo "Cliente fechado")
    canEdit && [1, 2, 3, 4, 5, 6, 7].includes(tag.id)
  );

  const handleTagSelect = async (tagId: number) => {
    if (!leadId) return;
    
    try {
      setLoading(true);
      
      // Se selecionou "Cliente fechado", atualizar status para vendido (5)
      const updateData: any = { tag_id: tagId };
      if (tagId === 7) { // ID da tag "Cliente fechado"
        updateData.status_atendimento = 5; // Status vendido
      }
      
      const { error } = await supabase
        .from("elisaportas_leads")
        .update(updateData)
        .eq("id", leadId);

      if (error) throw error;

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
      
      const { error } = await supabase
        .from("elisaportas_leads")
        .update({ tag_id: null })
        .eq("id", leadId);

      if (error) throw error;

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

        {!canEdit ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              Não é possível alterar a etiqueta neste status do lead.
            </p>
          </div>
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  );
}