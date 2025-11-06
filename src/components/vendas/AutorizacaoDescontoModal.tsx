import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAllUsers } from '@/hooks/useAllUsers';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { RESPONSAVEL_SETOR_ID } from '@/utils/descontoVendasRules';

interface AutorizacaoDescontoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAutorizado: (autorizadorId: string) => void;
  percentualDesconto: number;
  tipoAutorizacao: 'responsavel_setor' | 'master';
  limitePermitido: number;
}

const SENHA_MESTRE = "1qazxsw2";

export function AutorizacaoDescontoModal({
  open,
  onOpenChange,
  onAutorizado,
  percentualDesconto,
  tipoAutorizacao,
  limitePermitido
}: AutorizacaoDescontoModalProps) {
  const [senha, setSenha] = useState('');
  const [autorizadorId, setAutorizadorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  
  const { data: usuarios = [], isLoading: loadingUsuarios } = useAllUsers();
  
  // Filtrar usuários baseado no tipo de autorização
  const usuariosFiltrados = useMemo(() => {
    if (tipoAutorizacao === 'responsavel_setor') {
      return usuarios.filter(u => u.user_id === RESPONSAVEL_SETOR_ID);
    }
    return usuarios;
  }, [usuarios, tipoAutorizacao]);

  useEffect(() => {
    if (open) {
      setSenha('');
      setAutorizadorId('');
      setErro('');
    }
  }, [open]);

  const handleAutorizar = async () => {
    if (!senha.trim()) {
      setErro(tipoAutorizacao === 'master' ? 'Digite a senha mestre' : 'Digite a senha do responsável');
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

      // Para responsável do setor, validar que o usuário correto foi selecionado
      if (tipoAutorizacao === 'responsavel_setor' && autorizadorId !== RESPONSAVEL_SETOR_ID) {
        setErro('Usuário selecionado não é o responsável do setor');
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
            <DialogTitle>
              {tipoAutorizacao === 'master' ? 'Autorização Master Necessária' : 'Autorização do Responsável Necessária'}
            </DialogTitle>
          </div>
          <DialogDescription>
            O desconto de <span className="font-bold text-foreground">{percentualDesconto.toFixed(1)}%</span> excede 
            o limite permitido de <span className="font-bold text-foreground">{limitePermitido.toFixed(0)}%</span>. 
            {tipoAutorizacao === 'master' 
              ? ' É necessária autorização com senha master.'
              : ' É necessária autorização do responsável do setor.'}
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
                {usuariosFiltrados.map((usuario) => (
                  <SelectItem key={usuario.id} value={usuario.user_id}>
                    {usuario.nome} - {usuario.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">
              {tipoAutorizacao === 'master' ? 'Senha Master *' : 'Senha do Responsável *'}
            </Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value);
                setErro('');
              }}
              onKeyPress={handleKeyPress}
              placeholder={tipoAutorizacao === 'master' ? 'Digite a senha master' : 'Digite a senha do responsável'}
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