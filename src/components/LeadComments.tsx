import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare, Plus, Trash2 } from "lucide-react";

interface Comment {
  id: string;
  comentario: string;
  created_at: string;
  usuario_id: string;
  usuario_nome?: string;
}

interface LeadCommentsProps {
  leadId: string;
}

export function LeadComments({ leadId }: LeadCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("lead_comentarios")
        .select(`
          id,
          comentario,
          created_at,
          usuario_id
        `)
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar nomes dos usuários
      const userIds = [...new Set(data?.map(comment => comment.usuario_id) || [])];
      const { data: usersData } = await supabase
        .from("admin_users")
        .select("user_id, nome")
        .in("user_id", userIds);

      const usersMap = new Map(usersData?.map(u => [u.user_id, u.nome]) || []);

      const commentsWithNames = data?.map(comment => ({
        ...comment,
        usuario_nome: usersMap.get(comment.usuario_id) || "Usuário"
      })) || [];

      setComments(commentsWithNames);
    } catch (error) {
      console.error("Erro ao buscar comentários:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("lead_comentarios")
        .insert({
          lead_id: leadId,
          usuario_id: user?.id,
          comentario: newComment.trim()
        });

      if (error) throw error;

      setNewComment("");
      fetchComments();
      toast({
        title: "Sucesso",
        description: "Comentário adicionado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao adicionar comentário",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("lead_comentarios")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      fetchComments();
      toast({
        title: "Sucesso",
        description: "Comentário removido com sucesso",
      });
    } catch (error) {
      console.error("Erro ao remover comentário:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao remover comentário",
      });
    }
  };

  useEffect(() => {
    fetchComments();
  }, [leadId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comentários
        </CardTitle>
        <CardDescription>
          Histórico de comentários e observações do lead
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Adicionar novo comentário */}
        <div className="space-y-3">
          <Textarea
            placeholder="Adicione um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button 
            onClick={handleAddComment} 
            disabled={!newComment.trim() || submitting}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            {submitting ? "Adicionando..." : "Adicionar Comentário"}
          </Button>
        </div>

        {/* Lista de comentários */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground text-center py-4">Carregando comentários...</p>
          ) : comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum comentário ainda</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-4 rounded-lg bg-muted/30">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {comment.usuario_nome?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{comment.usuario_nome}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {(isAdmin || comment.usuario_id === user?.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{comment.comentario}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}