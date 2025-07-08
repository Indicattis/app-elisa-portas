
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { leadTags, getTagsByIds, type LeadTag } from "@/utils/leadTags";
import { X } from "lucide-react";

interface LeadTagManagerProps {
  leadId: string;
  currentTags: string[];
  onTagsUpdate: (newTags: string[]) => void;
  canEdit: boolean;
}

export function LeadTagManager({ leadId, currentTags, onTagsUpdate, canEdit }: LeadTagManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddTag = async () => {
    if (!selectedTag || currentTags.includes(selectedTag)) return;

    setLoading(true);
    try {
      const newTags = [...currentTags, selectedTag];
      
      const { error } = await supabase
        .from("elisaportas_leads")
        .update({ observacoes: JSON.stringify({ tags: newTags }) })
        .eq("id", leadId);

      if (error) throw error;

      onTagsUpdate(newTags);
      setSelectedTag("");
      
      toast({
        title: "Sucesso",
        description: "Etiqueta adicionada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao adicionar etiqueta:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao adicionar etiqueta",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    setLoading(true);
    try {
      const newTags = currentTags.filter(tag => tag !== tagId);
      
      const { error } = await supabase
        .from("elisaportas_leads")
        .update({ observacoes: JSON.stringify({ tags: newTags }) })
        .eq("id", leadId);

      if (error) throw error;

      onTagsUpdate(newTags);
      
      toast({
        title: "Sucesso",
        description: "Etiqueta removida com sucesso",
      });
    } catch (error) {
      console.error("Erro ao remover etiqueta:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao remover etiqueta",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentTagObjects = getTagsByIds(currentTags);
  const availableTags = leadTags.filter(tag => !currentTags.includes(tag.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Etiquetas do Lead</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tags Atuais */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">Etiquetas aplicadas:</span>
          <div className="flex flex-wrap gap-2">
            {currentTagObjects.length > 0 ? (
              currentTagObjects.map((tag) => (
                <Badge
                  key={tag.id}
                  className={`${tag.bgColor} ${tag.textColor} ${tag.color} border-2 flex items-center gap-2`}
                >
                  {tag.name}
                  {canEdit && (
                    <button
                      onClick={() => handleRemoveTag(tag.id)}
                      className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                      disabled={loading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">Nenhuma etiqueta aplicada</span>
            )}
          </div>
        </div>

        {/* Adicionar Nova Tag */}
        {canEdit && (
          <div className="space-y-3">
            <span className="text-sm font-medium text-muted-foreground">Adicionar etiqueta:</span>
            <div className="flex gap-2">
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione uma etiqueta" />
                </SelectTrigger>
                <SelectContent>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${tag.bgColor}`} />
                        {tag.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAddTag}
                disabled={!selectedTag || loading}
                size="sm"
              >
                Adicionar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
