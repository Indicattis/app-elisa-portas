import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";

interface ResetPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userEmail: string;
}

export function ResetPasswordModal({ 
  open, 
  onOpenChange, 
  userId, 
  userName,
  userEmail 
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateSuggestedPassword = (name: string) => {
    // Remove espaços extras e divide o nome
    const parts = name.trim().split(/\s+/);
    
    if (parts.length === 0) return "";
    
    // Primeira letra do primeiro nome
    const firstLetter = parts[0].charAt(0).toLowerCase();
    
    // Último nome (sobrenome)
    const lastName = parts[parts.length - 1].toLowerCase();
    
    return `${firstLetter}${lastName}`;
  };

  useEffect(() => {
    if (open) {
      const suggested = generateSuggestedPassword(userName);
      setPassword(suggested);
    }
  }, [open, userName]);

  const handleReset = async () => {
    if (!password || password.length < 6) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("reset-user-password", {
        body: { userId, newPassword: password },
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Senha redefinida com sucesso",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao redefinir senha do usuário",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNew = () => {
    const suggested = generateSuggestedPassword(userName);
    setPassword(suggested);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redefinir Senha</DialogTitle>
          <DialogDescription>
            Defina uma nova senha para {userName} ({userEmail})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a nova senha"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGenerateNew}
                title="Gerar sugestão"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Sugestão: primeira letra do nome + sobrenome
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleReset} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Redefinir Senha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
