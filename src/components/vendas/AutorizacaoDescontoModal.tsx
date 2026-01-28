import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAllUsers } from '@/hooks/useAllUsers';
import { useLiderVendas } from '@/hooks/useLiderVendas';
import { useConfiguracoesVendas } from '@/hooks/useConfiguracoesVendas';
import { Loader2, AlertCircle, ShieldCheck, Infinity } from 'lucide-react';

interface AutorizacaoDescontoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAutorizado: (autorizadorId: string) => void;
  percentualDesconto: number;
  tipoAutorizacao: 'responsavel_setor' | 'master';
  limitePermitido: number;
}

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
  const { data: liderVendas, isLoading: loadingLider } = useLiderVendas();
  const { configuracoes, isLoading: loadingConfig, limites, refetch: refetchConfiguracoes } = useConfiguracoesVendas();
  
  // Filtrar usuários baseado no tipo de autorização
  const usuariosFiltrados = useMemo(() => {
    if (tipoAutorizacao === 'responsavel_setor') {
      // Se há líder de vendas configurado, mostrar apenas ele
      if (liderVendas) {
        return [{
          id: liderVendas.user_id,
          user_id: liderVendas.user_id,
          nome: liderVendas.nome,
          email: liderVendas.email,
          role: liderVendas.role,
          foto_perfil_url: liderVendas.foto_perfil_url,
          ativo: true
        }];
      }
      return [];
    }
    return usuarios;
  }, [usuarios, tipoAutorizacao, liderVendas]);

  useEffect(() => {
    if (open) {
      // Forçar recarregamento das configurações quando modal abre
      refetchConfiguracoes();
      setSenha('');
      setErro('');
      
      // Auto-selecionar o líder de vendas se disponível
      if (tipoAutorizacao === 'responsavel_setor' && liderVendas) {
        setAutorizadorId(liderVendas.user_id);
      } else if (tipoAutorizacao === 'master' && configuracoes?.responsavel_senha_master_id) {
        setAutorizadorId(configuracoes.responsavel_senha_master_id);
      } else {
        setAutorizadorId('');
      }
    }
  }, [open, tipoAutorizacao, liderVendas, configuracoes, refetchConfiguracoes]);

  const handleAutorizar = async () => {
    if (!senha.trim()) {
      setErro(tipoAutorizacao === 'master' ? 'Digite a senha master' : 'Digite a senha do responsável');
      return;
    }

    if (!autorizadorId) {
      setErro('Selecione o usuário autorizador');
      return;
    }

    if (loadingConfig || !configuracoes) {
      setErro('Carregando configurações...');
      return;
    }

    setLoading(true);
    setErro('');

    try {
      // Validar senha baseado no tipo de autorização
      let senhaValida = false;
      
      if (tipoAutorizacao === 'master') {
        // Verificar senha master
        senhaValida = senha === configuracoes.senha_master;
      } else {
        // Verificar senha do responsável
        senhaValida = senha === configuracoes.senha_responsavel;
      }

      if (!senhaValida) {
        setErro('Senha incorreta');
        return;
      }

      // Validar usuário para senha do responsável
      if (tipoAutorizacao === 'responsavel_setor') {
        if (!liderVendas) {
          setErro('Nenhum líder de vendas configurado no sistema');
          return;
        }
        if (autorizadorId !== liderVendas.user_id) {
          setErro('Usuário selecionado não é o líder de vendas');
          return;
        }
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
            o limite permitido de <span className="font-bold text-foreground">{limitePermitido.toFixed(0)}%</span> em{' '}
            <span className="font-bold text-foreground">{(percentualDesconto - limitePermitido).toFixed(1)}%</span>.
            {tipoAutorizacao === 'master' 
              ? ` É necessária a senha master (desconto acima de ${limites.totalComResponsavel}%).`
              : ` É necessária a senha do responsável (até ${limites.totalComResponsavel}%).`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {tipoAutorizacao === 'responsavel_setor' && !liderVendas && !loadingLider && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhum líder de vendas configurado. Configure um líder em Configurações → Setores e Líderes.
              </AlertDescription>
            </Alert>
          )}

          {tipoAutorizacao === 'master' && (
            <Alert className="bg-red-500/10 border-red-500/30">
              <Infinity className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                A senha master desbloqueia qualquer percentual de desconto.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="autorizador">Quem está autorizando? *</Label>
            <Select
              value={autorizadorId}
              onValueChange={(value) => {
                setAutorizadorId(value);
                setErro('');
              }}
              disabled={loading || loadingUsuarios || loadingLider || usuariosFiltrados.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  loadingLider || loadingUsuarios 
                    ? "Carregando..." 
                    : usuariosFiltrados.length === 0
                    ? "Nenhum usuário disponível"
                    : "Selecione o autorizador"
                } />
              </SelectTrigger>
              <SelectContent>
                {usuariosFiltrados.map((usuario) => (
                  <SelectItem key={usuario.user_id} value={usuario.user_id}>
                    {usuario.nome} - {usuario.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tipoAutorizacao === 'responsavel_setor' && liderVendas && (
              <p className="text-xs text-muted-foreground">
                Líder de vendas configurado: {liderVendas.nome}
              </p>
            )}
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
