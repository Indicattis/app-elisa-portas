

# Corrigir listagem de acessorios e adicionais em /administrativo/financeiro/faturamento/produtos

## Problema

Ao expandir as pastas de acessorios e adicionais, todos aparecem agrupados como "Acessorio sem nome" ou "Adicional sem nome". Isso acontece porque muitos produtos na tabela `produtos_vendas` nao possuem `acessorio_id` ou `adicional_id` preenchidos, mas todos possuem o campo `descricao` com o nome correto (ex: "Controle Avulso", "Nobreak", "Caixa de fechamento (1m-3m)").

## Solucao

Alterar o hook `useFaturamentoDetalhado.ts` para usar o campo `descricao` como fallback (e como chave de agrupamento) quando `acessorio_id` ou `adicional_id` estiverem nulos.

## Detalhes tecnicos

### Arquivo: `src/hooks/useFaturamentoDetalhado.ts`

Na logica de determinacao do nome do detalhe (linhas 129-134), alterar para:

**Acessorios (linha 129-131):**
- Se `acessorio_id` existe, buscar nome no map (comportamento atual)
- Se nao, usar `produto.descricao` como nome e como chave de agrupamento
- Fallback final: "Acessorio sem nome"

**Adicionais (linha 132-134):**
- Se `adicional_id` existe, buscar nome no map (comportamento atual)
- Se nao, usar `produto.descricao` como nome e como chave de agrupamento
- Fallback final: "Adicional sem nome"

```typescript
// Acessorios
if (tipo === 'acessorios' || tipo === 'acessorio') {
  if (produto.acessorio_id) {
    detalheId = produto.acessorio_id;
    detalheNome = acessoriosMap.get(produto.acessorio_id) || produto.descricao || 'Acessorio nao encontrado';
  } else {
    detalheId = produto.descricao || 'sem_nome';
    detalheNome = produto.descricao || 'Acessorio sem nome';
  }
}

// Adicionais
if (tipo === 'adicionais' || tipo === 'adicional') {
  if (produto.adicional_id) {
    detalheId = produto.adicional_id;
    detalheNome = adicionaisMap.get(produto.adicional_id) || produto.descricao || 'Adicional nao encontrado';
  } else {
    detalheId = produto.descricao || 'sem_nome';
    detalheNome = produto.descricao || 'Adicional sem nome';
  }
}
```

Isso fara com que os itens sejam agrupados pelo nome da descricao (ex: todos "Controle Avulso" juntos, todos "Nobreak" juntos), mostrando corretamente na listagem expandida.

### Arquivo editado
1. `src/hooks/useFaturamentoDetalhado.ts` - Usar `descricao` como fallback para nome e agrupamento
