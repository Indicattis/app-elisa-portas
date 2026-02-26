

# Corrigir exclusao de parcelas em Contas a Receber

## Problema

A tabela `contas_receber` tem RLS (Row Level Security) ativado, mas so possui policies para SELECT, INSERT e UPDATE. Nao existe policy para DELETE, entao o Supabase silenciosamente bloqueia a exclusao e retorna 204 (sucesso) sem deletar nada.

## Solucao

Criar uma migration SQL adicionando uma policy de DELETE para usuarios autenticados na tabela `contas_receber`.

### SQL da migration

```sql
CREATE POLICY "Authenticated users can delete contas_receber"
  ON public.contas_receber
  FOR DELETE
  USING (auth.uid() IS NOT NULL);
```

Nenhuma alteracao de codigo e necessaria -- apenas a policy faltante no banco de dados.

