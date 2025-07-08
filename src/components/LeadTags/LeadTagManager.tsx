
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { leadTags, getLeadTag } from "@/utils/leadTags";
import { Tag } from "lucide-react";

interface LeadTagManagerProps {
  leadId: string;
  currentTag: string | null;
  onTagUpdate: (newTag: string | null) => void;
  canEdit: boolean;
}

export function LeadTagManager({ leadId, currentTag, onTagUpdate, canEdit }: LeadTagManagerProps) {
  const [selectedTag, setSelectedTag] = useState<string>(currentTag || "atendimento_primeiro");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const currentTagObj = currentTag ? getLeadTag([currentTag]) : null;

  const handleUpdateTag = async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    try {
      const observacoes = JSON.stringify({ tags: [selectedTag] });
      
      const { error } = await supabase
        .from("elisaportas_leads")
        .update({ observacoes })
        .eq("id", leadId);

      if (error) throw error;

      onTagUpdate(selectedTag);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Etiqueta do Lead
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Etiqueta atual */}
        <div>
          <span className="text-sm text-muted-foreground block mb-2">Etiqueta atual:</span>
          {currentTagObj ? (
            <Badge
              className={`${currentTagObj.bgColor} ${currentTagObj.textColor}`}
            >
              {currentTagObj.name}
            </Badge>
          ) : (
            <span className="text-muted-foreground">Nenhuma etiqueta</span>
          )}
        </div>

        {/* Editor de etiqueta */}
        {canEdit && (
          <div className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground block mb-2">Alterar etiqueta:</span>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma etiqueta" />
                </SelectTrigger>
                <SelectContent>
                  {leadTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${tag.bgColor}`} />
                        {tag.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleUpdateTag} 
              disabled={isLoading || selectedTag === currentTag}
              className="w-full"
            >
              {isLoading ? "Atualizando..." : "Atualizar Etiqueta"}
            </Button>
          </div>
        )}

        {!canEdit && (
          <p className="text-sm text-muted-foreground">
            Você não tem permissão para alterar a etiqueta deste lead.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
