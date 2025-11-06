import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAllUsers } from '@/hooks/useAllUsers';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

interface AutorizacaoDescontoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAutorizado: (autorizadorId: string) => void;
  percentualDesconto: number;
}

const SENHA_MESTRE = "1qazxsw2";

export function AutorizacaoDescontoModal({
  open,
  onOpenChange,
  onAutorizado,
  percentualDesconto
}: AutorizacaoDescontoModalProps) {
  const [senha, setSenha] = useState('');
  const [autorizadorId, setAutorizadorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  
  const { data: usuarios = [], isLoading: loadingUsuarios } = useAllUsers();

  useEffect(() => {
    if (open) {
      setSenha('');
      setAutorizadorId('');
      setErro('');
    }
  }, [open]);

  const handleAutorizar = async () => {
    if (!senha.trim()) {
      setErro('Digite a senha mestre');
      return;
    }

    if (!autorizadorId) {
      setErro('Selecione o usuário autorizador');
      return;
    }

    setLoading(true);
    setErro('');

    try {
      // Validar senha mestre
      if (senha !== SENHA_MESTRE) {
        setErro('Senha incorreta');
        return;
      }

      // Senha correta, prosseguir
      onAutorizado(autorizadorId);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao autorizar desconto:', error);
      setErro('Erro ao processar autorização. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && senha && autorizadorId) {
      handleAutorizar();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-6 w-6 text-amber-500" />
            <DialogTitle>Autorização de Desconto Necessária</DialogTitle>
          </div>
          <DialogDescription>
            O desconto de <span className="font-bold text-foreground">{percentualDesconto.toFixed(1)}%</span> excede 
            o limite permitido de 10%. É necessária autorização com senha mestre.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="autorizador">Quem está autorizando? *</Label>
            <Select
              value={autorizadorId}
              onValueChange={(value) => {
                setAutorizadorId(value);
                setErro('');
              }}
              disabled={loading || loadingUsuarios}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o autorizador" />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map((usuario) => (
                  <SelectItem key={usuario.id} value={usuario.user_id}>
                    {usuario.nome} - {usuario.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha Mestre *</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value);
                setErro('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="Digite a senha mestre"
              disabled={loading}
              autoFocus
            />
          </div>

          {erro && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAutorizar}
            disabled={loading || !senha || !autorizadorId}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              'Autorizar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}