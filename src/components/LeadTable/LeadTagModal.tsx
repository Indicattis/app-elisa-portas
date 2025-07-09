
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tag } from "lucide-react";
import { leadTags, getLeadTag } from "@/utils/leadTags";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LeadTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  currentTag: string | null;
  onTagUpdate: () => void;
  canEdit: boolean;
}

export function LeadTagModal({
  isOpen,
  onClose,
  leadId,
  currentTag,
  onTagUpdate,
  canEdit
}: LeadTagModalProps) {
  const [selectedTag, setSelectedTag] = useState<string>(currentTag || "atendimento_primeiro");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdateTag = async () => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Você não tem permissão para alterar a etiqueta deste lead.",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const observacoes = JSON.stringify({ tags: [selectedTag] });
      
      const { error } = await supabase
        .from("elisaportas_leads")
        .update({ observacoes })
        .eq("id", leadId);

      if (error) throw error;

      onTagUpdate();
      onClose();
      toast({
        title: "Sucesso",
        description: "Etiqueta atualizada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao atualizar etiqueta:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar etiqueta",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentTagObj = currentTag ? getLeadTag([currentTag]) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Alterar Etiqueta do Lead
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Etiqueta atual */}
          <div>
            <span className="text-sm font-medium text-muted-foreground block mb-2">
              Etiqueta atual:
            </span>
            {currentTagObj ? (
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: currentTagObj.bgColor }}
                >
                  <Tag 
                    className="w-4 h-4 text-white" 
                    fill="currentColor"
                  />
                </div>
                <span className="text-sm">{currentTagObj.name}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Nenhuma etiqueta</span>
            )}
          </div>

          {/* Seleção de nova etiqueta */}
          {canEdit && (
            <div>
              <span className="text-sm font-medium text-muted-foreground block mb-3">
                Selecionar nova etiqueta:
              </span>
              <RadioGroup 
                value={selectedTag} 
                onValueChange={setSelectedTag}
                className="space-y-3"
              >
                {leadTags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-3">
                    <RadioGroupItem value={tag.id} id={tag.id} />
                    <Label 
                      htmlFor={tag.id} 
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: tag.bgColor }}
                      >
                        <Tag 
                          className="w-4 h-4 text-white" 
                          fill="currentColor"
                        />
                      </div>
                      <span className="text-sm">{tag.name}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {!canEdit && (
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              Você não tem permissão para alterar a etiqueta deste lead.
            </p>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            {canEdit && (
              <Button 
                onClick={handleUpdateTag} 
                disabled={isLoading || selectedTag === currentTag}
              >
                {isLoading ? "Atualizando..." : "Atualizar Etiqueta"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
