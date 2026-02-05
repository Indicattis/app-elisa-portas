
# Plano: Corrigir Pedido 0081 e Arquivar

## Resumo da Correcao
Mover o pedido 0081 diretamente para o Arquivo Morto, deletando apenas a ordem de qualidade duplicada que foi criada pela anomalia.

## Acoes Necessarias

### 1. Deletar Ordem Duplicada
A ordem de qualidade `OQU-2026-0092` (id: `7c99ade7-5309-4acf-9db8-e7c3050ad19f`) foi criada erroneamente em 05/02 e deve ser removida.

```sql
DELETE FROM ordens_qualidade 
WHERE id = '7c99ade7-5309-4acf-9db8-e7c3050ad19f';
```

### 2. Atualizar Pedido para Arquivo Morto
Corrigir o pedido retornando-o para `finalizado` e marcando como arquivado.

```sql
UPDATE pedidos_producao
SET 
  etapa_atual = 'finalizado',
  arquivado = true,
  data_arquivamento = now(),
  arquivado_por = auth.uid()  -- usuario atual
WHERE id = '1ed5836f-9448-4828-88b7-7f2aa8c74a71';
```

## O Que Sera Preservado
Todas as ordens de producao ja concluidas permanecerao intactas:

| Ordem | Numero | Status | Preservado |
|-------|--------|--------|------------|
| Soldagem | OSL-2026-0025 | concluido | Sim |
| Perfiladeira | OPE-2026-0027 | concluido | Sim |
| Separacao | OSE-2026-0026 | concluido | Sim |
| Qualidade | OQU-2026-0081 | concluido | Sim |
| Pintura | PINT-00073 | pronta | Sim |
| Carregamento | - | concluida | Sim |

## O Que Sera Removido
Apenas a ordem de qualidade duplicada:
- `OQU-2026-0092` (criada em 05/02 por anomalia)

## Resultado Final
- Pedido 0081 estara no Arquivo Morto
- Acessivel em `/fabrica/arquivo-morto`
- Todas as ordens originais permanecem no historico
- Nenhum colaborador precisara refazer trabalho
