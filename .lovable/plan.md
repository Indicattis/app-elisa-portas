

## Plano: Corrigir Botão "Regenerar Linhas" para Ordens de Qualidade e Pintura

### Diagnóstico

O erro **"Tipo de ordem inválido"** ocorre porque:

1. **O botão "Regenerar linhas" aparece para TODOS os tipos de ordem**
2. **A função SQL `regenerar_linhas_ordem` só suporta 3 tipos:**
   - `soldagem`
   - `perfiladeira`
   - `separacao`

3. **Ordens de `qualidade` e `pintura` não são suportadas** porque:
   - Não possuem linhas baseadas em `pedido_linhas` com `categoria_linha`
   - São etapas de verificação/processamento, não de produção de itens

### Código Atual da Função SQL

```sql
CASE p_tipo_ordem
  WHEN 'soldagem' THEN ...
  WHEN 'perfiladeira' THEN ...
  WHEN 'separacao' THEN ...
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Tipo de ordem inválido');
END CASE;
```

### Solução

Ocultar o botão "Regenerar linhas" para ordens que não são de produção (`qualidade` e `pintura`).

**Arquivo:** `src/components/fabrica/OrdemLinhasSheet.tsx`

```typescript
// Definir tipos que suportam regeneração
const TIPOS_COM_REGENERACAO: TipoOrdem[] = ['soldagem', 'perfiladeira', 'separacao'];

// Na renderização do botão:
{TIPOS_COM_REGENERACAO.includes(ordem?.tipo || '') && (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        size="sm"
        variant="outline"
        onClick={() => regenerarLinhas.mutate()}
        disabled={regenerarLinhas.isPending || isOrdemConcluida}
        ...
      >
        ...
      </Button>
    </TooltipTrigger>
  </Tooltip>
)}
```

### Por que NÃO expandir a função SQL?

Ordens de qualidade e pintura têm estrutura diferente:
- **Qualidade:** É uma verificação geral do pedido, não tem linhas próprias
- **Pintura:** Pode ter linhas, mas baseadas em metragem, não em `categoria_linha`

Adicionar suporte seria mais complexo e não traria benefício real - essas ordens não precisam de regeneração de linhas.

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/fabrica/OrdemLinhasSheet.tsx` | Condicionar exibição do botão "Regenerar linhas" |

### Resultado Esperado

- Botão "Regenerar linhas" só aparece para ordens de **Soldagem**, **Perfiladeira** e **Separação**
- Ordens de **Qualidade** e **Pintura** não exibem o botão
- Nenhum erro "Tipo de ordem inválido" ao abrir sheets de qualidade/pintura

