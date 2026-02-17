

# Adicionar barras de progresso nas metas de instalacao

## Resumo

Contabilizar as instalacoes concluidas (da tabela `neo_instalacoes`) dentro do periodo de vigencia de cada meta e exibir uma barra de progresso.

## Logica de contagem

### Meta de Equipe
- Busca em `neo_instalacoes` onde `equipe_id = equipe.id`, `concluida = true` e `concluida_em` dentro do periodo da meta (data_inicio ate data_termino)
- Conta o numero de registros = portas instaladas

### Meta do Gerente
- Busca em `neo_instalacoes` onde `concluida = true` e `concluida_em` dentro do periodo da meta
- Inclui TODAS as instalacoes: equipes internas + autorizados (sem filtro de equipe/autorizado)
- Conta o total de registros

## Alteracoes

### 1. Criar hook `useProgressoMetaInstalacao` (em `useMetasInstalacao.ts`)

Novo hook que recebe uma meta e retorna a contagem de instalacoes concluidas:

```typescript
export function useProgressoMetaInstalacao(meta: MetaInstalacao | null) {
  return useQuery({
    queryKey: ["progresso-meta-instalacao", meta?.id],
    enabled: !!meta,
    queryFn: async () => {
      // Para gerente: todas as instalacoes concluidas no periodo
      // Para equipe: instalacoes concluidas pela equipe no periodo
      let query = supabase
        .from("neo_instalacoes")
        .select("id", { count: "exact", head: true })
        .eq("concluida", true)
        .gte("concluida_em", meta.data_inicio)
        .lte("concluida_em", meta.data_termino + "T23:59:59");
      
      if (meta.tipo === "equipe") {
        query = query.eq("equipe_id", meta.referencia_id);
      }
      // gerente: sem filtro adicional (todas)
      
      return count;
    },
  });
}
```

### 2. Atualizar `MetaCard` para exibir barra de progresso

O componente `MetaCard` passara a:
- Receber a contagem de progresso como prop (ou buscar internamente)
- Exibir barra de progresso usando o componente `Progress`
- Mostrar "X / Y portas" e porcentagem
- Quando atingir 100%, exibir estilo verde com icone de trofeu

### 3. Arquivo `MetasInstalacoesDirecao.tsx`

- Importar o novo hook
- Passar os dados de progresso para cada `MetaCard`
- O `MetaCard` se torna auto-suficiente: recebe a meta e busca o progresso

## Detalhes tecnicos

### Arquivos modificados

- `src/hooks/useMetasInstalacao.ts` - adicionar hook `useProgressoMetaInstalacao`
- `src/pages/direcao/MetasInstalacoesDirecao.tsx` - atualizar `MetaCard` para incluir barra de progresso com dados reais

### Consulta SQL para equipe

```sql
SELECT count(*) FROM neo_instalacoes
WHERE equipe_id = '{equipe_id}'
  AND concluida = true
  AND concluida_em >= '{data_inicio}'
  AND concluida_em <= '{data_termino}T23:59:59'
```

### Consulta SQL para gerente

```sql
SELECT count(*) FROM neo_instalacoes
WHERE concluida = true
  AND concluida_em >= '{data_inicio}'
  AND concluida_em <= '{data_termino}T23:59:59'
```

### Visual do MetaCard atualizado

- Barra de progresso com cor primaria (verde quando >= 100%)
- Texto "12 / 50 portas" acima da barra
- Porcentagem no canto direito
- Icone de trofeu quando meta atingida
- Periodo de vigencia abaixo

